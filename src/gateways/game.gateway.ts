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

const { game: events } = eventConstants;

@WebSocketGateway({ namespace: events.namespaceName })
export class GameGateway implements OnGatewayDisconnect {
    constructor(
        @InjectRepository(Game) private readonly gameRepository: Repository<Game>
    ) {}

    @WebSocketServer()
    server: Server;

    handleDisconnect(client: Socket): void {

    }

}
