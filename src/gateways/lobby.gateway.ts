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
import { Repository } from 'typeorm';
import { Game } from '@app/database/entities/game.entity';
import {
    GetPlayers,
    PlayerEnter,
    PlayerLeft,
    PlayerReadyStatus, StartGame
} from '@utils/interfaces/events/lobby/input.interface';
import { LobbyPlayer } from '@utils/interfaces/events/lobby/output.interface';
import { events as eventConstants } from '@utils/constants';

const { lobby: events } = eventConstants;

@WebSocketGateway({ namespace: events.namespaceName })
export class LobbyGateway implements OnGatewayDisconnect {
    constructor(
        @InjectRepository(Game) private readonly gameRepository: Repository<Game>
    ) {}

    @WebSocketServer()
    server: Server;

    private games: { [gameSlug: string]: Game; } = {};

    @SubscribeMessage(events.input.PLAYER_ENTER)
    async playerEnter(@MessageBody() data: PlayerEnter,
                      @ConnectedSocket() client: Socket): Promise<void> {
        if (!this.games[data.game]) {
            this.games[data.game] = await this.gameRepository.findOne({ slug: data.game });
        }

        this.games[data.game].players.push({
            name: data.playerName,
            socketId: client.id,
            lobbyReady: false
        });
        // with this, all players should be joined in a room with the game's slug as an id
        // emitting to all players in the game should be then easier
        client.join(data.game);
        // emit to all other players in the lobby - EXCEPT sender
        client.to(data.game).emit(events.output.PLAYER_ENTERED_LOBBY, {
            id: client.id,
            name: data.playerName
        });
        if (this.games[data.game].players.length >= 2) {
            // emit to all players in the room (including sender)
            this.server.in(data.game).emit(events.output.GAME_PLAYABLE);
        }
    }

    @SubscribeMessage(events.input.PLAYER_READY_STATUS)
    playerReadyStatus(@MessageBody() data: PlayerReadyStatus,
                      @ConnectedSocket() client: Socket): void {
        const player = this.games[data.game].getPlayer(client.id);
        player.lobbyReady = data.ready;
        // let client take care of pairing ID and names
        client.to(data.game).emit(events.output.PLAYER_CHANGED_READY_STATUS, {
            id: client.id,
            newStatus: data.ready
        });
        if (this.games[data.game].readyCheck()) {
            this.server.in(data.game).emit(events.output.ALL_READY);
        }
    }

    @SubscribeMessage(events.input.START_GAME)
    startGame(@MessageBody() data: StartGame,
              @ConnectedSocket() client: Socket): void {
        this.server.in(data.game).emit(events.output.GAME_STARTED);
    }

    @SubscribeMessage(events.input.GET_PLAYERS)
    getPlayers(@MessageBody() data: GetPlayers,
               @ConnectedSocket() client: Socket): LobbyPlayer[] {
        return this.games[data.game].players.map(player => ({
            id: player.socketId,
            name: player.name,
            ready: player.lobbyReady
        }));
    }

    @SubscribeMessage(events.input.PLAYER_LEFT)
    playerLeft(@MessageBody() data: PlayerLeft,
               @ConnectedSocket() client: Socket): void {
        this.removePlayerFromGame(client, this.games[data.game]);
    }

    handleDisconnect(client: Socket) {
        // since the client closed the tab, find the game he was in (usually this is sent alongside each event)
        const game: Game = Object.values(this.games).find(g => !!g.players.find(p => p.socketId === client.id));
        this.removePlayerFromGame(client, game);
    }

    removePlayerFromGame(client: Socket, game: Game) {
        if (!game) {
            return;
        }
        game.removePlayer(client.id);
        client.leave(game.slug);
        client.to(game.slug).emit(events.output.PLAYER_LEFT_LOBBY, {
            playerId: client.id
        });
        // TODO: if game has zero players, remove from this.games and also DB
    }
}
