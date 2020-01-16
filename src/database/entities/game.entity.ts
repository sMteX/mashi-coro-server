import { Column, Entity, Generated, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Player as PlayerClass } from '@app/classes/player';
import { Player as PlayerEntity } from './player.entity';

@Entity()
export class Game {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Generated('uuid')
    slug: string;

    @OneToMany(type => PlayerEntity, player => player.game)
    players: PlayerEntity[];

    // TODO: store references to players (with sockets? order?)
    // tslint:disable-next-line:variable-name
    _players: PlayerClass[] = [];

    readyCheck(): boolean {
        return this._players.every(player => player.lobbyReady);
    }
    getPlayer(id: string): PlayerClass {
        return this._players.find(player => player.socketId === id);
    }
    removePlayer(id: string): void {
        this._players = this._players.filter(player => player.socketId !== id);
    }
}
