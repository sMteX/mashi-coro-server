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
    private readiness: {
        [gameSlug: string]: {
            [playerId: string]: boolean
        }
    } = {};

    readyCheck(gameSlug: string) {
        return Object.values(this.readiness[gameSlug]).every(ready => ready);
    }

    @SubscribeMessage(events.input.PLAYER_ENTER)
    async playerEnter(@MessageBody() data: PlayerEnter,
                      @ConnectedSocket() client: Socket): Promise<void> {
        if (!this.games[data.game]) {
            this.games[data.game] = await this.gameRepository.findOne({ slug: data.game });
            this.readiness[data.game] = {};
        }

        // creates a new player entity and saves it (this.games[...].players DOESN'T HAVE the reference to it because we loaded it before this save, but we don't need it)
        const entity = new Player({
            name: data.playerName,
            socketId: client.id,
            game: this.games[data.game]
        });
        await this.playerRepository.save(entity);

        // store the lobby readiness status locally
        this.readiness[data.game][client.id] = false;
        // with this, all players should be joined in a room with the game's slug as an id
        // emitting to all players in the game should be then easier
        client.join(data.game);
        // emit to all other players in the lobby - EXCEPT sender
        client.to(data.game).emit(events.output.PLAYER_ENTERED_LOBBY, {
            id: client.id,
            name: data.playerName
        });
        // I hope this doesn't count any other properties...
        if (Object.keys(this.readiness[data.game]).length >= 2) {
            // emit to all players in the room (including sender)
            this.server.in(data.game).emit(events.output.GAME_PLAYABLE);
        }
    }

    @SubscribeMessage(events.input.PLAYER_READY_STATUS)
    playerReadyStatus(@MessageBody() data: PlayerReadyStatus,
                      @ConnectedSocket() client: Socket): void {
        this.readiness[data.game][client.id] = data.ready;
        // let client take care of pairing ID and names
        client.to(data.game).emit(events.output.PLAYER_CHANGED_READY_STATUS, {
            id: client.id,
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
            const readiness = this.readiness[data.game][player.socketId];
            return {
                id: player.socketId,
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
            .where('player.socketId = :id', { id: client.id })
            .getOne();
        await this.removePlayerFromGame(client, game);
    }

    async removePlayerFromGame(client: Socket, game: Game) {
        if (!game) {
            return;
        }
        await this.playerRepository.delete({
            socketId: client.id
        });
        delete this.readiness[game.slug][client.id];
        client.to(game.slug).emit(events.output.PLAYER_LEFT_LOBBY, {
            id: client.id
        });
        client.leave(game.slug);
        // TODO: if game has zero players, remove from this.games and also DB
    }
}
