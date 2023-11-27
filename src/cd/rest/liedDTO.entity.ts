/* eslint-disable @typescript-eslint/no-magic-numbers */

/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import { ApiProperty } from '@nestjs/swagger';
import { MaxLength } from 'class-validator';

/**
 * Entity-Klasse für Lieder ohne TypeORM.
 */
export class LiedDTO {
    @MaxLength(32)
    @ApiProperty({ example: 'MR.Brightside', type: String })
    readonly liedTitel!: string;

    @ApiProperty({ example: '3.24', type: String })
    readonly liedLaenge!: number;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
