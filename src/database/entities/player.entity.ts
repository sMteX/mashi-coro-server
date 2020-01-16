import { Column, Entity, Generated, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Game } from './game.entity';

@Entity()
@Unique(['socketId'])
export class Player {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    socketId: string;

    @ManyToOne(type => Game, game => game.players)
    game: Game;
}
