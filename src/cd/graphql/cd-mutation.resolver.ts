// eslint-disable-next-line max-classes-per-file
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { IsInt, IsNumberString, Min } from 'class-validator';
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { type CD } from '../entity/cd.entity.js';
import { CDDTO } from '../rest/cdDTO.entity.js';
import { CDWriteService } from '../service/cd-write.service.js';
import { HttpExceptionFilter } from './http-exception.filter.js';
import { JwtAuthGraphQlGuard } from '../../security/auth/jwt/jwt-auth-graphql.guard.js';
import { type Lied } from '../entity/lied.entity.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { RolesAllowed } from '../../security/auth/roles/roles-allowed.decorator.js';
import { RolesGraphQlGuard } from '../../security/auth/roles/roles-graphql.guard.js';
import { getLogger } from '../../logger/logger.js';

export interface CreatePayload {
    readonly id: number;
}

export interface UpdatePayload {
    readonly version: number;
}

export class CDUpdateDTO extends CDDTO {
    @IsNumberString()
    readonly id!: string;

    @IsInt()
    @Min(0)
    readonly version!: number;
}
@Resolver()
@UseGuards(JwtAuthGraphQlGuard, RolesGraphQlGuard)
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class CDMutationResolver {
    readonly #service: CDWriteService;

    readonly #logger = getLogger(CDMutationResolver.name);

    constructor(service: CDWriteService) {
        this.#service = service;
    }

    @Mutation()
    @RolesAllowed('admin', 'fachabteilung')
    async create(@Args('input') cdDTO: CDDTO) {
        this.#logger.debug('create: cdDTO=%o', cdDTO);

        const cd = this.#cdDtoToCD(cdDTO);
        const id = await this.#service.create(cd);
        // TODO BadUserInputError
        this.#logger.debug('createCD: id=%d', id);
        const payload: CreatePayload = { id };
        return payload;
    }

    @Mutation()
    @RolesAllowed('admin', 'fachabteilung')
    async update(@Args('input') cdDTO: CDUpdateDTO) {
        this.#logger.debug('update: cd=%o', cdDTO);

        const cd = this.#cdUpdateDtoToCD(cdDTO);
        const versionStr = `"${cdDTO.version.toString()}"`;

        const versionResult = await this.#service.update({
            id: Number.parseInt(cdDTO.id, 10),
            cd,
            version: versionStr,
        });
        // TODO BadUserInputError
        this.#logger.debug('updateBuch: versionResult=%d', versionResult);
        const payload: UpdatePayload = { version: versionResult };
        return payload;
    }

    #cdDtoToCD(cdDTO: CDDTO): CD {
        const lieder = cdDTO.lieder?.map((liedDTO) => {
            const lied: Lied = {
                id: undefined,
                liedTitel: liedDTO.liedTitel,
                liedLaenge: liedDTO.liedLaenge,
                cd: undefined,
            };
            return lied;
        });
        const cd: CD = {
            id: undefined,
            version: undefined,
            isrc: cdDTO.isrc,
            bewertung: cdDTO.bewertung,
            titel: cdDTO.title,
            preis: cdDTO.preis,
            laenge: cdDTO.laenge,
            verfuegbar: cdDTO.verfuegbar,
            erscheinungsdatum: cdDTO.erscheinungsdatum,
            genre: cdDTO.genre,
            interpret: cdDTO.interpret,
            lieder,
            erzeugt: undefined,
            aktualisiert: undefined,
        };

        return cd;
    }

    #cdUpdateDtoToCD(cdDTO: CDUpdateDTO): CD {
        return {
            id: undefined,
            version: undefined,
            isrc: cdDTO.isrc,
            bewertung: cdDTO.bewertung,
            titel: cdDTO.title,
            preis: cdDTO.preis,
            laenge: cdDTO.laenge,
            verfuegbar: cdDTO.verfuegbar,
            erscheinungsdatum: cdDTO.erscheinungsdatum,
            genre: cdDTO.genre,
            interpret: cdDTO.interpret,
            lieder: undefined,
            erzeugt: undefined,
            aktualisiert: undefined,
        };
    }
}
