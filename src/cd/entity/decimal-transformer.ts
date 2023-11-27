/**
 * Das Modul besteht aus der Transformer-Klasse für Spalten vom Typ DECIMAL.
 * @packageDocumentation
 */

import { type ValueTransformer } from 'typeorm';

// https://github.com/typeorm/typeorm/issues/873#issuecomment-328945433
// "grosse" Zahlen als String und nicht number (Stichwort: Rundungsfehler)
// statt number ggf. Decimal aus decimal.js analog zu BigDecimal von Java
// https://medium.com/@matthew.bajorek/how-to-properly-handle-decimals-with-typeorm-f0eb2b79ca9c
export class DecimalTransformer implements ValueTransformer {
    /**
     * Transformation beim Schreiben in die DB
     */
    to(decimal?: number): string | undefined {
        return decimal?.toString();
    }

    /**
     * Transformation beim Lesen aus der DB
     */
    from(decimal?: string): number | undefined {
        return decimal === undefined ? undefined : Number(decimal);
    }
}
