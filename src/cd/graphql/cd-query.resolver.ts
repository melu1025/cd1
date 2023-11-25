import { Args, Query, Resolver } from '@nestjs/graphql';
import { UseFilters, UseInterceptors } from '@nestjs/common';
import { CD } from '../entity/cd.entity.js';
import { CDReadService } from '../service/cd-read.service.js';
import { HttpExceptionFilter } from './http-exception.filter.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { getLogger } from '../../logger/logger.js';

export interface IdInput {
    readonly id: number;
}

@Resolver((_: any) => CD)
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class CDQueryResolver {
    readonly #service: CDReadService;

    readonly #logger = getLogger(CDQueryResolver.name);

    constructor(service: CDReadService) {
        this.#service = service;
    }

    @Query('cd')
    async findById(@Args() idInput: IdInput) {
        const { id } = idInput;
        this.#logger.debug('findById: id=%d', id);

        const cd = await this.#service.findById({ id });

        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'findById: cd=%s, titel=%o',
                cd.toString(),
                cd.titel,
            );
        }
        return cd;
    }

    @Query('cds')
    async find(@Args() titel: { titel: string } | undefined) {
        const titelStr = titel?.titel;
        this.#logger.debug('find: Suchkriterium titel=%s', titelStr);
        const suchkriterium = titelStr === undefined ? {} : { titel: titelStr };

        const cds = await this.#service.find(suchkriterium);

        this.#logger.debug('find: cds=%o', cds);
        return cds;
    }
}
