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
import { events as eventConstants } from '@utils/constants';
import { GameHandler } from '@app/classes/gameHandler';
import { PlayerConnect } from '@utils/interfaces/events/game/input.interface';

const { game: events } = eventConstants;

@WebSocketGateway({ namespace: events.namespaceName })
export class GameGateway implements OnGatewayDisconnect {
    constructor(
        @InjectRepository(Game) private readonly gameRepository: Repository<Game>
    ) {}

    @WebSocketServer()
    server: Server;

    private socketIdMap: { [socketId: string]: number } = {};
    private games: {
        [gameSlug: string]: {
            game: Game,
            handler: GameHandler
        }
    } = {};

    handleDisconnect(client: Socket): void {
        // TODO: remove from game, if 1 player remains = close game
        delete this.socketIdMap[client.id];
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

    @SubscribeMessage(events.input.PLAYER_CONNECT)
    async playerConnect(@MessageBody() data: PlayerConnect,
                        @ConnectedSocket() client: Socket): Promise<void> {
        // in this stage, all players are ready and we started the game, so players connect here to the actual game room
        this.socketIdMap[client.id] = data.id;
        if (!this.games[data.game]) {
            this.games[data.game] = { game: null, handler: null };
            this.games[data.game].game = await this.gameRepository.findOne({
                where: {
                    slug: data.game
                },
                relations: ['players'] // might not be needed
            });
        }
        client.join(data.game); // join the game room

        // players will connect in matter of milliseconds to seconds apart from each other, might as well wait and send all the info at once
        if (this.allPlayersConnected(this.games[data.game].game)) {
            this.games[data.game].handler = new GameHandler(this.games[data.game].game, this.server, this.socketIdMap);

            // emit starting data to the room - players (names, cards, money), buyable cards, game bank etc. - to setup the client UI
            const gameStartingData = this.games[data.game].handler.constructInitialData();
            this.server.in(data.game).emit(events.output.GAME_STARTING, gameStartingData);

            setTimeout(() => {
                // actually start the game in GameHandler - pick a player, allow them to play, block the others
            }, 500);
        }
    }

    allPlayersConnected(game: Game) {
        // not sure if the safest way, but since there's a different socket for each player
        // and we're storing it in the map, we should be able to find it from there
        let allConnected = true;
        const connectedIds = Object.values(this.socketIdMap);
        game.players.forEach(({ id }) => {
            if (!connectedIds.includes(id)) {
                allConnected = false;
                return;
            }
        });
        return allConnected;
    }
}
