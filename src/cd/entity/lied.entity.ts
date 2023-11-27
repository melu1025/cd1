import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { CD } from './cd.entity.js';
import { DecimalTransformer } from './decimal-transformer.js';

@Entity()
export class Lied {
    @Column('int')
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('varchar', { unique: true, length: 32 })
    readonly liedTitel!: string;

    @Column('decimal', {
        precision: 8,
        scale: 2,
        transformer: new DecimalTransformer(),
    })
    readonly liedLaenge: number | undefined;

    @ManyToOne(() => CD, (cd) => cd.lieder)
    @JoinColumn({ name: 'cd_id' })
    cd: CD | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            liedTitel: this.liedTitel,
            liedLaenge: this.liedLaenge,
        });
}
