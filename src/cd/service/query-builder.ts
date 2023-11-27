/**
 * Das Modul besteht aus der Klasse {@linkcode QueryBuilder}.
 * @packageDocumentation
 */

import { CD } from '../entity/cd.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Lied } from '../entity/lied.entity.js';
import { Repository } from 'typeorm';
import { type Suchkriterien } from './cd-read.service.js';
import { getLogger } from '../../logger/logger.js';
import { typeOrmModuleOptions } from '../../config/db.js';

/** Typdefinitionen für die Suche mit der CD-ID. */
export interface BuildIdParams {
    /** ID der gesuchten CD. */
    readonly id: number;
    /** Sollen die Lieder mitgeladen werden? */
    readonly mitLiedern?: boolean;
}
/**
 * Die Klasse `QueryBuilder` implementiert das Lesen für CDs und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class QueryBuilder {
    readonly #cdAlias = `${CD.name.charAt(0).toLowerCase()}${CD.name.slice(1)}`;

    readonly #liedAlias = `${Lied.name
        .charAt(0)
        .toLowerCase()}${Lied.name.slice(1)}`;

    readonly #repo: Repository<CD>;

    readonly #logger = getLogger(QueryBuilder.name);

    constructor(@InjectRepository(CD) repo: Repository<CD>) {
        this.#repo = repo;
    }

    /**
     * Eine cD mit der ID suchen.
     * @param id ID der gesuchten CD
     * @returns QueryBuilder
     */
    buildId({ id, mitLiedern = false }: BuildIdParams) {
        const queryBuilder = this.#repo.createQueryBuilder(this.#cdAlias);
        if (mitLiedern) {
            queryBuilder.leftJoinAndSelect(
                `${this.#cdAlias}.lieder`,
                this.#liedAlias,
            );
        }
        queryBuilder.where(`${this.#cdAlias}.id = :id`, { id: id }); // eslint-disable-line object-shorthand
        return queryBuilder;
    }

    /**
     * CDs asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns QueryBuilder
     */
    build({ titel, ...props }: Suchkriterien) {
        this.#logger.debug('build: props=%o', props);

        let queryBuilder = this.#repo.createQueryBuilder(this.#cdAlias);

        // z.B. { titel: 'a', rating: 5, javascript: true }
        // "rest properties" fuer anfaengliche WHERE-Klausel: ab ES 2018 https://github.com/tc39/proposal-object-rest-spread
        // type-coverage:ignore-next-line
        // const { titel, javascript, typescript, ...props } = suchkriterien;

        let useWhere = true;

        if (titel !== undefined && typeof titel === 'string') {
            const ilike =
                typeOrmModuleOptions.type === 'postgres' ? 'ilike' : 'like';
            queryBuilder = queryBuilder.where(
                `${this.#cdAlias}.titel ${ilike} :titel`,
                { titel: `%${titel}%` },
            );
            useWhere = false;
        }

        // Restliche Properties als Key-Value-Paare: Vergleiche auf Gleichheit
        Object.keys(props).forEach((key) => {
            const param: Record<string, any> = {};
            param[key] = (props as Record<string, any>)[key]; // eslint-disable-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection
            queryBuilder = useWhere
                ? queryBuilder.where(`${this.#cdAlias}.${key} = :${key}`, param)
                : queryBuilder.andWhere(
                      `${this.#cdAlias}.${key} = :${key}`,
                      param,
                  );
            useWhere = false;
        });

        this.#logger.debug('build: sql=%s', queryBuilder.getSql());
        return queryBuilder;
    }
}
