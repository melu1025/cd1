/* eslint-disable max-classes-per-file, @typescript-eslint/no-magic-numbers */
/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Florian Goebel, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import {
    IsArray,
    IsBoolean,
    IsISO8601,
    IsISRC,
    IsInt,
    IsOptional,
    IsPositive,
    Matches,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { type CDGenre } from '../entity/cd.entity.js';
import { LiedDTO } from './liedDTO.entity.js';
import { Type } from 'class-transformer';

export const MAX_RATING = 5;

/**
 * Entity-Klasse für Bücher ohne TypeORM und ohne Referenzen.
 */
export class CDDtoOhneRef {
    // https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch04s13.html
    @IsISRC()
    @ApiProperty({ example: '978-0-007-00644-1', type: String })
    readonly isrc!: string;

    @IsInt()
    @Min(0)
    @Max(MAX_RATING)
    @ApiProperty({ example: 5, type: Number })
    readonly bewertung: number | undefined;

    @Matches(/^POP$|^HIPHOP$/u)
    @IsOptional()
    @ApiProperty({ example: 'HIPHOP', type: String })
    readonly genre: CDGenre | undefined;

    @IsPositive()
    @ApiProperty({ example: 1, type: Number })
    // statt number ggf. Decimal aus decimal.js analog zu BigDecimal von Java
    readonly preis!: number;

    @Min(0.01)
    @Max(12)
    @IsOptional()
    @ApiProperty({ example: 2.1, type: Number })
    readonly laenge: number | undefined;

    @IsBoolean()
    @ApiProperty({ example: true, type: Boolean })
    readonly verfuegbar: boolean | undefined;

    @IsISO8601({ strict: true })
    @IsOptional()
    @ApiProperty({ example: '2022-09-31' })
    readonly erscheinungsdatum: Date | string | undefined;

    @IsOptional()
    @ApiProperty({ example: 'ABBY Road', type: String })
    readonly title!: string;

    @IsOptional()
    @ApiProperty({ example: 'Ken Carson', type: String })
    readonly interpret: string | undefined;
}

/**
 * Entity-Klasse für Bücher ohne TypeORM.
 */
export class CDDTO extends CDDtoOhneRef {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => LiedDTO)
    @ApiProperty({ type: [LiedDTO] })
    readonly lieder: LiedDTO[] | undefined;
}
/* eslint-enable max-classes-per-file, @typescript-eslint/no-magic-numbers */
