import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { events as eventConstants } from '@utils/constants';

const { lobby: events } = eventConstants;

@WebSocketGateway({ namespace: events.namespaceName })
export class LobbyGateway {
    @WebSocketServer()
    server: Server;

    @SubscribeMessage(events.input.PLAYER_ENTER)
    playerEnter(): void {
        // TODO: step 5: track clients somehow so we know when we gotta send req. to player 1, where to send it
        //  if there are at least 2 players in the lobby, emit event to all players that game is playable
        //  also, if a player entered the game, emit event to all others that a player entered game

        this.server.emit(events.output.PLAYER_ENTERED_LOBBY, {});
        // if at least 2 players:
            this.server.emit(events.output.GAME_PLAYABLE, {});
    }

    @SubscribeMessage(events.input.PLAYER_READY_STATUS)
    playerReadyStatus(): void {
        // TODO: store the ready status of all players, also re-emit current state
        this.server.emit(events.output.PLAYER_CHANGED_READY_STATUS, {});
    }

    @SubscribeMessage(events.input.PLAYER_LEFT)
    playerLeft(): void {
        // TODO: player left lobby, re-emit
        this.server.emit(events.output.PLAYER_LEFT_LOBBY, {});
    }
}
