import {
    ConnectedSocket,
    MessageBody,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { events as eventConstants } from '@utils/constants';
import { PlayerEnter, PlayerReadyStatus } from '@utils/interfaces/events/lobby/input.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from '@app/database/entities/game.entity';
import { Repository } from 'typeorm';

const { lobby: events } = eventConstants;

@WebSocketGateway({ namespace: events.namespaceName })
export class LobbyGateway implements OnGatewayDisconnect {
    constructor(
        @InjectRepository(Game) private readonly gameRepository: Repository<Game>
    ) {}

    @WebSocketServer()
    server: Server;

    private game: Game = null;

    @SubscribeMessage(events.input.PLAYER_ENTER)
    async playerEnter(@MessageBody() data: PlayerEnter,
                      @ConnectedSocket() client: Socket): Promise<void> {
        // TODO: step 5: track clients somehow so we know when we gotta send req. to player 1, where to send it
        //  if there are at least 2 players in the lobby, emit event to all players that game is playable
        //  also, if a player entered the game, emit event to all others that a player entered game

        if (!this.game) {
            this.game = await this.gameRepository.findOne({ slug: data.game });
        }

        this.game.players.push({
            name: data.playerName,
            socketId: client.id,
            lobbyReady: false
        });
        // with this, all players should be joined in a room with the game's slug as an id
        // emitting to all players in the game should be then easier
        client.join(data.game);
        // emit to all other players in the lobby - EXCEPT sender
        client.to(this.game.slug).emit(events.output.PLAYER_ENTERED_LOBBY, {
            playerId: client.id,
            playerName: data.playerName
        });
        // this.server.emit(events.output.PLAYER_ENTERED_LOBBY, {});
        if (this.game.players.length >= 2) {
            // emit to all players in the room (including sender)
            this.server.in(this.game.slug).emit(events.output.GAME_PLAYABLE);
        }
    }

    @SubscribeMessage(events.input.PLAYER_READY_STATUS)
    playerReadyStatus(@MessageBody() data: PlayerReadyStatus,
                      @ConnectedSocket() client: Socket): void {
        // TODO: store the ready status of all players, also re-emit current state
        const player = this.game.getPlayer(client.id);
        player.lobbyReady = data.ready;
        // let client take care of pairing ID and names
        client.to(this.game.slug).emit(events.output.PLAYER_CHANGED_READY_STATUS, {
            playerId: client.id,
            newStatus: data.ready
        });
        if (this.game.readyCheck()) {
            this.server.in(this.game.slug).emit(events.output.ALL_READY);
        }
    }

    @SubscribeMessage(events.input.PLAYER_LEFT)
    playerLeft(@ConnectedSocket() client: Socket): void {
        // TODO: player left lobby, re-emit
        console.log('player disconnected in playerLeft');
        this.game.removePlayer(client.id);
        this.server.emit(events.output.PLAYER_LEFT_LOBBY, {
            playerId: client.id
        });
    }

    handleDisconnect(client: Socket) {
        console.log('player disconnected in handleDisconnect');
    }
}
