import { Column, Entity, Generated, PrimaryGeneratedColumn } from 'typeorm';
import { Player } from '@app/classes/player';

@Entity()
export class Game {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Generated('uuid')
    slug: string;

    // TODO: store references to players (with sockets? order?)
    players: Player[] = [];

    constructor() { }
}
