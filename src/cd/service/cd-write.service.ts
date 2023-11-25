/**
 * Das Modul besteht aus der Klasse {@linkcode CDWriteService} für die
 * Schreiboperationen im Anwendungskern.
 * @packageDocumentation
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import {
    IsrcExistsException,
    VersionInvalidException,
    VersionOutdatedException,
} from './exceptions.js';
import { CD } from '../entity/cd.entity.js';
import { CDReadService } from './cd-read.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { MailService } from '../../mail/mail.service.js';
import { type Repository } from 'typeorm';
import { getLogger } from '../../logger/logger.js';
import re2 from 're2';

/** Typdefinitionen zum Aktualisieren einer CD mit `update`. */
export interface UpdateParams {
    /** ID der zu aktualisierenden cd. */
    readonly id: number | undefined;
    /** CD-Objekt mit den aktualisierten Werten. */
    readonly cd: CD;
    /** Versionsnummer für die aktualisierenden Werte. */
    readonly version: string;
}

/**
 * Die Klasse `CDWriteService` implementiert den Anwendungskern für das
 * Schreiben von Bücher und greift mit _TypeORM_ auf die DB zu.
 */
@Injectable()
export class CDWriteService {
    private static readonly VERSION_PATTERN = new re2('^"\\d*"');

    readonly #repo: Repository<CD>;

    readonly #readService: CDReadService;

    readonly #mailService: MailService;

    readonly #logger = getLogger(CDWriteService.name);

    constructor(
        @InjectRepository(CD) repo: Repository<CD>,
        readService: CDReadService,
        mailService: MailService,
    ) {
        this.#repo = repo;
        this.#readService = readService;
        this.#mailService = mailService;
    }

    /**
     * Ein neues CD soll angelegt werden.
     * @param cd Die neu anzulegende CD
     * @returns Die ID der neu angelegten CDes
     * @throws IsrcExists falls die ISRC-Nummer bereits existiert
     */
    async create(cd: CD): Promise<number> {
        this.#logger.debug('create: cd=%o', cd);
        await this.#validateCreate(cd);

        const cdDb = await this.#repo.save(cd); // implizite Transaktion
        this.#logger.debug('create: cdDb=%o', cdDb);

        await this.#sendmail(cdDb);

        return cdDb.id!;
    }

    /**
     * Eine vorhandenesCD soll aktualisiert werden.
     * @param cd Die zu aktualisierende CD
     * @param id ID der zu aktualisierenden CD
     * @param version Die Versionsnummer für optimistische Synchronisation
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     * @throws VersionInvalidException falls die Versionsnummer ungültig ist
     * @throws VersionOutdatedException falls die Versionsnummer veraltet ist
     */
    // https://2ality.com/2015/01/es6-destructuring.html#simulating-named-parameters-in-javascript
    async update({ id, cd, version }: UpdateParams): Promise<number> {
        this.#logger.debug('update: id=%d, cd=%o, version=%s', id, cd, version);
        if (id === undefined) {
            this.#logger.debug('update: Keine gueltige ID');
            throw new NotFoundException(`Es gibt keine CD mit der ID ${id}.`);
        }

        const validateResult = await this.#validateUpdate(cd, id, version);
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof CD)) {
            return validateResult;
        }

        const cdNeu = validateResult;
        const merged = this.#repo.merge(cdNeu, cd);
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged); // implizite Transaktion
        this.#logger.debug('update: updated=%o', updated);

        return updated.version!;
    }

    async #validateCreate(cd: CD): Promise<undefined> {
        this.#logger.debug('#validateCreate: cd=%o', cd);

        const { isrc } = cd;
        try {
            await this.#readService.find({ isrc: isrc }); // eslint-disable-line object-shorthand
        } catch (err) {
            if (err instanceof NotFoundException) {
                return;
            }
        }
        throw new IsrcExistsException(isrc);
    }

    async #sendmail(cd: CD) {
        const subject = `Neue CD ${cd.id}`;
        const { titel } = cd;
        const body = `Die CD mit dem Titel <strong>${titel}</strong> ist angelegt`;
        await this.#mailService.sendmail({ subject, body });
    }

    async #validateUpdate(cd: CD, id: number, versionStr: string): Promise<CD> {
        const version = this.#validateVersion(versionStr);
        this.#logger.debug('#validateUpdate: cd=%o, version=%s', cd, version);

        const resultFindById = await this.#findByIdAndCheckVersion(id, version);
        this.#logger.debug('#validateUpdate: %o', resultFindById);
        return resultFindById;
    }

    #validateVersion(version: string | undefined): number {
        this.#logger.debug('#validateVersion: version=%s', version);
        if (
            version === undefined ||
            !CDWriteService.VERSION_PATTERN.test(version)
        ) {
            throw new VersionInvalidException(version);
        }

        return Number.parseInt(version.slice(1, -1), 10);
    }

    async #findByIdAndCheckVersion(id: number, version: number): Promise<CD> {
        const cdDb = await this.#readService.findById({ id });

        // nullish coalescing
        const versionDb = cdDb.version!;
        if (version < versionDb) {
            this.#logger.debug(
                '#checkIdAndVersion: VersionOutdated=%d',
                version,
            );
            throw new VersionOutdatedException(version);
        }

        return cdDb;
    }
}
