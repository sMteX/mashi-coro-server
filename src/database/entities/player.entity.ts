import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Game } from './game.entity';

@Entity()
export class Player {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => Game, game => game.players)
    game: Game;

    constructor(data: Partial<Player>) {
        Object.assign(this, data);
    }
}
