import { CD, type CDGenre } from './../entity/cd.entity.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryBuilder } from './query-builder.js';
import { getLogger } from '../../logger/logger.js';
import re2 from 're2';

/**
 * Typdefinition für `findById`
 */
export interface FindByIdParams {
    /** ID der gesuchten CD */
    readonly id: number;
    /** Sollen die Lieder mitgeladen werden? */
    readonly mitLiedern?: boolean;
}
export interface Suchkriterien {
    readonly isrc?: string;
    readonly bewertung?: number;
    readonly art?: CDGenre;
    readonly preis?: number;
    readonly laenge?: number;
    readonly verfuegbar?: boolean;
    readonly erscheinungsdatum?: string;
    readonly interpret?: string;
    readonly titel?: string;
    readonly pop?: string;
    readonly rap?: string;
}

/**
 * Die Klasse `CDReadService` implementiert das Lesen für CDs und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class CDReadService {
    static readonly ID_PATTERN = new re2('^[1-9][\\d]*$');

    readonly #cdProps: string[];

    readonly #queryBuilder: QueryBuilder;

    readonly #logger = getLogger(CDReadService.name);

    constructor(queryBuilder: QueryBuilder) {
        const cdDummy = new CD();
        this.#cdProps = Object.getOwnPropertyNames(cdDummy);
        this.#queryBuilder = queryBuilder;
    }

    /**
     * Eine CD asynchron anhand seiner ID suchen
     * @param id ID der gesuchten CD
     * @returns Die gefundene CD vom Typ [CD](cd_entity_cd_entity.Cd.html)
     *          in einem Promise aus ES2015.
     * @throws NotFoundException falls keine CD mit der ID existiert
     */
    async findById({ id, mitLiedern = false }: FindByIdParams) {
        this.#logger.debug('findById: id=%d', id);

        const cd = await this.#queryBuilder
            .buildId({ id, mitLiedern })
            .getOne();
        if (cd === null) {
            throw new NotFoundException(`Es gibt keine CD mit der ID ${id}.`);
        }

        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'findById: cd=%s, titel=%o',
                cd.toString(),
                cd.titel,
            );
            if (mitLiedern) {
                this.#logger.debug('findById: lieder=%o', cd.lieder);
            }
        }
        return cd;
    }

    /**
     * CD asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns Ein JSON-Array mit den gefundenen CDs.
     * @throws NotFoundException falls keine CDs gefunden wurden.
     */
    async find(suchkriterien?: Suchkriterien) {
        this.#logger.debug('find: suchkriterien=%o', suchkriterien);

        if (suchkriterien === undefined) {
            return this.#queryBuilder.build({}).getMany();
        }

        const keys = Object.keys(suchkriterien);
        if (keys.length === 0) {
            return this.#queryBuilder.build(suchkriterien).getMany();
        }

        if (!this.#checkKeys(keys)) {
            throw new NotFoundException('Ungueltige Suchkriterien');
        }

        const cds = await this.#queryBuilder.build(suchkriterien).getMany();
        this.#logger.debug('find: CDs=%o', cds);
        if (cds.length === 0) {
            throw new NotFoundException(
                `Keine CDs gefunden: ${JSON.stringify(suchkriterien)}`,
            );
        }

        return cds;
    }

    #checkKeys(keys: string[]) {
        let validKeys = true;
        keys.forEach((key) => {
            if (
                !this.#cdProps.includes(key) &&
                key !== 'pop' &&
                key !== 'rap'
            ) {
                this.#logger.debug(
                    '#find: ungueltiges Suchkriterium "%s"',
                    key,
                );
                validKeys = false;
            }
        });

        return validKeys;
    }
}
