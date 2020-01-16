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
import { GameHandler } from '@app/classes/gameHandler';

const { game: events } = eventConstants;
interface GameWrapper {
    game: Game;
    connectedPlayers: string[];
    handler: GameHandler;
}

@WebSocketGateway({ namespace: events.namespaceName })
export class GameGateway implements OnGatewayDisconnect {
    constructor(
        @InjectRepository(Game) private readonly gameRepository: Repository<Game>
    ) {}

    @WebSocketServer()
    server: Server;

    private games: { [gameSlug: string]: GameWrapper} = {};

    handleDisconnect(client: Socket): void {

    }

    /*
        Since GameGateway is most likely a singleton, we first need to gather all the players together
        (since they're connected automatically upon loading the game page, this should take relatively short amount of time)
        ... come to think of it, I should be storing the players in DB probably (the socket IDs + number ID for connecting to Game instance)
        instead of passing them around in unreliable ways...

        Anyway, when all players have connected, create a GameHandler instance that handles a specific game, also pass server instance and maybe all sockets?
        don't know if those will work though.. other idea is to expose setCurrentPlayer(Socket), that should work

        the game handler then works with the game and can emit events through the server/client
     */
}
