import {
    ConnectedSocket,
    MessageBody,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from '@nestjs/websockets';
import { InjectRepository } from '@nestjs/typeorm';
import { Server, Socket } from 'socket.io';
import { createQueryBuilder, Repository } from 'typeorm';
import { Game } from '@app/database/entities/game.entity';
import {
    GetPlayers,
    PlayerEnter,
    PlayerLeft,
    PlayerReadyStatus, StartGame
} from '@utils/interfaces/events/lobby/input.interface';
import { LobbyPlayer } from '@utils/interfaces/events/lobby/output.interface';
import { events as eventConstants } from '@utils/constants';
import { Player } from '@app/database/entities/player.entity';

const { lobby: events } = eventConstants;

@WebSocketGateway({ namespace: events.namespaceName })
export class LobbyGateway implements OnGatewayDisconnect {
    constructor(
        @InjectRepository(Game) private readonly gameRepository: Repository<Game>,
        @InjectRepository(Player) private readonly playerRepository: Repository<Player>
    ) {}

    @WebSocketServer()
    server: Server;

    private games: { [gameSlug: string]: Game; } = {};
    private socketIdMap: { [playerId: string]: number; } = {};
    private readiness: {
        [gameSlug: string]: {
            [playerId: number]: boolean
        }
    } = {};

    readyCheck(gameSlug: string) {
        return Object.values(this.readiness[gameSlug]).every(ready => ready);
    }

    @SubscribeMessage(events.input.PLAYER_ENTER)
    async playerEnter(@MessageBody() data: PlayerEnter,
                      @ConnectedSocket() client: Socket): Promise<{ id: number; name: string; }> {
        if (!this.games[data.game]) {
            this.games[data.game] = await this.gameRepository.findOne({ slug: data.game });
            this.readiness[data.game] = {};
        }

        // creates a new player entity and saves it (this.games[...].players DOESN'T HAVE the reference to it because we loaded it before this save, but we don't need it)
        let player = new Player({
            name: data.playerName,
            game: this.games[data.game]
        });
        player = await this.playerRepository.save(player);
        this.socketIdMap[client.id] = player.id;

        // store the lobby readiness status locally
        this.readiness[data.game][player.id] = false;
        // with this, all players should be joined in a room with the game's slug as an id
        // emitting to all players in the game should be then easier
        client.join(data.game);
        // emit to all other players in the lobby - EXCEPT sender
        client.to(data.game).emit(events.output.PLAYER_ENTERED_LOBBY, {
            id: player.id,
            name: data.playerName
        });
        // I hope this doesn't count any other properties...
        if (Object.keys(this.readiness[data.game]).length >= 2) {
            // emit to all players in the room (including sender)
            this.server.in(data.game).emit(events.output.GAME_PLAYABLE);
        }
        // return new player's ID
        return {
            id: player.id,
            name: data.playerName
        };
    }

    @SubscribeMessage(events.input.PLAYER_READY_STATUS)
    playerReadyStatus(@MessageBody() data: PlayerReadyStatus,
                      @ConnectedSocket() client: Socket): void {
        const playerId = this.socketIdMap[client.id];
        this.readiness[data.game][playerId] = data.ready;
        // let client take care of pairing ID and names
        client.to(data.game).emit(events.output.PLAYER_CHANGED_READY_STATUS, {
            id: playerId,
            newStatus: data.ready
        });
        if (this.readyCheck(data.game)) {
            this.server.in(data.game).emit(events.output.ALL_READY);
        }
    }

    @SubscribeMessage(events.input.START_GAME)
    startGame(@MessageBody() data: StartGame,
              @ConnectedSocket() client: Socket): void {
        this.server.in(data.game).emit(events.output.GAME_STARTED);
    }

    @SubscribeMessage(events.input.GET_PLAYERS)
    async getPlayers(@MessageBody() data: GetPlayers,
               @ConnectedSocket() client: Socket): Promise<LobbyPlayer[]> {
        // load updated game from DB - we might as well save it too, it doesn't hurt
        this.games[data.game] = await this.gameRepository.findOne({
            where: { slug: data.game },
            relations: ['players']
        });
        return this.games[data.game].players.map((player) => {
            const readiness = this.readiness[data.game][player.id];
            return {
                id: player.id,
                name: player.name,
                ready: readiness
            };
        });
    }

    @SubscribeMessage(events.input.PLAYER_LEFT)
    async playerLeft(@MessageBody() data: PlayerLeft,
               @ConnectedSocket() client: Socket): Promise<void> {
        await this.removePlayerFromGame(client, this.games[data.game]);
    }

    async handleDisconnect(client: Socket): Promise<void> {
        // since the client closed the tab, find the game he was in (usually this is sent alongside each event)
        const game: Game = await createQueryBuilder(Game, 'game')
            .innerJoin('game.players', 'player')
            .where('player.id = :id', { id: this.socketIdMap[client.id] })
            .getOne();
        await this.removePlayerFromGame(client, game);
    }

    async removePlayerFromGame(client: Socket, game: Game) {
        if (!game) {
            return;
        }
        const playerId = this.socketIdMap[client.id];
        await this.playerRepository.delete({
            id: playerId
        });
        delete this.readiness[game.slug][playerId];
        delete this.socketIdMap[client.id];
        client.to(game.slug).emit(events.output.PLAYER_LEFT_LOBBY, {
            id: playerId
        });
        client.leave(game.slug);
        // TODO: if game has zero players, remove from this.games and also DB
    }
}
