import { Column, Entity, Generated, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Player } from './player.entity';

@Entity()
export class Game {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Generated('uuid')
    slug: string;

    @OneToMany(type => Player, player => player.game)
    players: Player[];
}
