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
    PlayerReadyStatus, StartGame
} from '@utils/interfaces/events/lobby/input.interface';
import { LobbyPlayer } from '@utils/interfaces/events/lobby/output.interface';
import { events as eventConstants } from '@utils/constants';
import { Player } from '@app/database/entities/player.entity';
import { ValidateFailReason } from '@utils/enums';

const { lobby: events } = eventConstants;
interface GameData {
    [gameSlug: string]: {
        game: Game;
        started: boolean;
        cleaned: boolean;
        readiness: {
            [playerId: number]: boolean
        }
    };
}

type PlayerEnterLobbyReturnType = { success: boolean } & ({ id: number; name: string; } | { reason: ValidateFailReason; });

@WebSocketGateway({ namespace: events.namespaceName })
export class LobbyGateway implements OnGatewayDisconnect {
    constructor(
        @InjectRepository(Game) private readonly gameRepository: Repository<Game>,
        @InjectRepository(Player) private readonly playerRepository: Repository<Player>
    ) {}

    @WebSocketServer()
    server: Server;

    private data: GameData = {};

    private socketIdMap: { [socketId: string]: number; } = {};
    private idSocketMap: { [playerId: number]: string; } = {};

    readyCheck(gameSlug: string) {
        return Object.values(this.data[gameSlug].readiness).every(ready => ready);
    }

    @SubscribeMessage(events.input.PLAYER_ENTER)
    async playerEnter(@MessageBody() data: PlayerEnter,
                      @ConnectedSocket() client: Socket): Promise<PlayerEnterLobbyReturnType> {
        if (!this.data[data.game]) {
            this.data[data.game] = {
                game: null,
                readiness: {},
                started: false,
                cleaned: false
            };
        }

        // we need up-to-date info about the game's players, so we fetch data every time to be sure
        this.data[data.game].game = await this.gameRepository.findOne({
            where: {
                slug: data.game
            },
            relations: ['players']
        });

        if (this.data[data.game].game.players.length >= 4) {
            return { success: false, reason: ValidateFailReason.GAME_FULL };
        }
        if (this.data[data.game].game.running) {
            return { success: false, reason: ValidateFailReason.GAME_RUNNING };
        }

        // creates a new player entity and saves it (this.games[...].players DOESN'T HAVE the reference to it because we loaded it before this save, but we don't need it)
        let player = new Player({
            name: data.playerName,
            game: this.data[data.game].game
        });
        player = await this.playerRepository.save(player);
        this.socketIdMap[client.id] = player.id;
        this.idSocketMap[player.id] = client.id;

        // store the lobby readiness status locally
        this.data[data.game].readiness[player.id] = false;
        // with this, all players should be joined in a room with the game's slug as an id
        // emitting to all players in the game should be then easier
        client.join(data.game);
        // emit to all other players in the lobby - EXCEPT sender
        client.to(data.game).emit(events.output.PLAYER_ENTERED_LOBBY, {
            id: player.id,
            name: data.playerName
        });
        // I hope this doesn't count any other properties...
        if (Object.keys(this.data[data.game].readiness).length >= 2) {
            // emit to all players in the room (including sender)
            this.server.in(data.game).emit(events.output.GAME_PLAYABLE);
        }
        // return new player's ID
        return {
            success: true,
            id: player.id,
            name: data.playerName
        };
    }

    @SubscribeMessage(events.input.PLAYER_READY_STATUS)
    playerReadyStatus(@MessageBody() data: PlayerReadyStatus,
                      @ConnectedSocket() client: Socket): void {
        const playerId = this.socketIdMap[client.id];
        this.data[data.game].readiness[playerId] = data.ready;
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
    async startGame(@MessageBody() data: StartGame,
              @ConnectedSocket() client: Socket): Promise<void> {
        this.data[data.game].started = true;
        this.data[data.game].game.running = true;
        await this.gameRepository.save(this.data[data.game].game);
        this.server.in(data.game).emit(events.output.GAME_STARTED);
    }

    @SubscribeMessage(events.input.GET_PLAYERS)
    async getPlayers(@MessageBody() data: GetPlayers,
               @ConnectedSocket() client: Socket): Promise<LobbyPlayer[]> {
        // load updated game from DB - we might as well save it too, it doesn't hurt
        this.data[data.game].game = await this.gameRepository.findOne({
            where: { slug: data.game },
            relations: ['players']
        });
        return this.data[data.game].game.players.map((player) => {
            const ready = this.data[data.game].readiness[player.id];
            return {
                ready,
                id: player.id,
                name: player.name
            };
        });
    }

    async handleDisconnect(client: Socket): Promise<void> {
        const game: Game = await createQueryBuilder(Game, 'game')
            .innerJoin('game.players', 'player')
            .where('player.id = :id', { id: this.socketIdMap[client.id] })
            .getOne();
        if (!game) {
            // just closed lobby (no game was yet created or joined)
            return;
        }
        if (this.data[game.slug].started) {
            // clean once
            if (!this.data[game.slug].cleaned) {
                // once the game is started, first one to disconnect will clear all data associated with that game
                this.gameStartingClear(game.slug);
                setTimeout(() => {
                    delete this.data[game.slug];
                }, 5000); // 5 seconds should be way more than needed
            }
        } else {
            // game hasn't started yet, player has disconnected in lobby - remove him from DB + all associated data
            await this.removePlayerFromGame(client, game);
        }
    }

    gameStartingClear(gameSlug: string) {
        // clear players from socket->id map
        Object.keys(this.data[gameSlug].readiness).forEach((id) => {
            delete this.socketIdMap[this.idSocketMap[id]];
            delete this.idSocketMap[id];
        });
        this.data[gameSlug].cleaned = true;
    }

    async removePlayerFromGame(client: Socket, game: Game) {
        if (!game) {
            return;
        }
        const playerId = this.socketIdMap[client.id];
        await this.playerRepository.delete({
            id: playerId
        });
        delete this.socketIdMap[client.id];
        delete this.idSocketMap[playerId];
        delete this.data[game.slug].readiness[playerId];
        client.to(game.slug).emit(events.output.PLAYER_LEFT_LOBBY, {
            id: playerId
        });
        client.leave(game.slug);
        // if there are no players left, delete the game too
        const updatedGame = await this.gameRepository.findOne({
            where: {
                slug: game.slug
            },
            relations: ['players']
        });
        if (updatedGame.players.length === 0) {
            delete this.data[game.slug];
            await this.gameRepository.remove(updatedGame);
        }
    }
}
