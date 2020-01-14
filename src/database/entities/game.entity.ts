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

    readyCheck(): boolean {
        return this.players.every(player => player.lobbyReady);
    }
    getPlayer(id: string): Player {
        return this.players.find(player => player.socketId === id);
    }
    removePlayer(id: string): void {
        this.players = this.players.filter(player => player.socketId !== id);
    }
}
