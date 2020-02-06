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
import { BuyCard, EndRoll, EndTurn, PlayerConnect, RollDice } from '@utils/interfaces/events/game/input.interface';
import { CardName } from '@app/classes/cards';

const { game: events } = eventConstants;
interface GamePair {
    game: Game;
    handler: GameHandler;
}
const DEFAULT_DELAY: number = 1000;

@WebSocketGateway({ namespace: events.namespaceName })
export class GameGateway implements OnGatewayDisconnect {
    constructor(
        @InjectRepository(Game) private readonly gameRepository: Repository<Game>
    ) {}

    @WebSocketServer()
    server: Server;

    private socketIdMap: { [socketId: string]: number } = {};
    private games: {
        [gameSlug: string]: GamePair
    } = {};

    async handleDisconnect(client: Socket): Promise<void> {
        const playerId = this.socketIdMap[client.id];
        delete this.socketIdMap[client.id];
        // find a game, where given player was
        const [gameSlug, pair] = Object.entries(this.games).find(([, { handler }]) => handler.playerIds.includes(playerId));
        // const pair: GamePair = Object.values(this.games).find(({ handler }) => handler.playerIds.includes(playerId));
        pair.game.players = pair.game.players.filter(p => p.id === playerId);
        // will this work? or need to inject playerRepository?
        await this.gameRepository.save(pair.game);

        if (pair.game.players.length >= 2) {
            // send event
            client.in(gameSlug).emit(events.output.PLAYER_LEFT_GAME, {
                playerId
            });
        } else {
            // end game
        }
        client.leave(gameSlug);
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
        if (this.allPlayersConnected(this.g(data.game))) {
            this.games[data.game].handler = new GameHandler(this.g(data.game), this.server, this.socketIdMap);

            // emit starting data to the room - players (names, cards, money), buyable cards, game bank etc. - to setup the client UI
            const gameStartingData = this.h(data.game).constructInitialData();
            this.server.in(data.game).emit(events.output.GAME_DATA_LOAD, gameStartingData);

            setTimeout(() => {
                this.h(data.game).startGame();
                this.server.in(data.game).emit(events.output.GAME_STARTING);
            }, DEFAULT_DELAY);
        }
    }

    @SubscribeMessage(events.input.DICE_ROLL)
    async diceRoll(@MessageBody() data: RollDice,
                   @ConnectedSocket() client: Socket): Promise<void> {
        // assume we can't call this in wrong situation - no checks for not having the specific cards
        const dice = this.h(data.game).rollDice(data.diceCount);
        this.server.in(data.game).emit(events.output.DICE_ROLL_OUTPUT, {
            dice,
            player: data.playerId,
            sum: dice[0] + (dice.length > 1 ? dice[1] : 0),
            transmitter: data.transmitter
        });
    }

    @SubscribeMessage(events.input.END_ROLL)
    async endRollAndTriggerCards(@MessageBody() data: EndRoll,
                                 @ConnectedSocket() client: Socket): Promise<void> {
        const game = this.h(data.game);
        const latestRoll = game.mostRecentRoll.dice;
        this.server.in(data.game).emit(events.output.FINAL_DICE_ROLL, {
            player: data.playerId,
            dice: latestRoll,
            sum: latestRoll[0] + (latestRoll.length > 1 ? latestRoll[1] : 0)
        });
        setTimeout(() => {
            // TODO: check red cards of all other players
            const beforeRed: { [p: number]: number } = game.currentPlayerMoneyMap;
            game.triggerRedCards();
            const afterRed: { [p: number]: number } = game.currentPlayerMoneyMap;

            // in here, others get coins from current player, so redGains contains how many coins OTHERS get from current player
            // [playerId]: coins
            const redGains = {};
            Object.keys(afterRed).forEach((id: string) => {
                if (Number(id) !== data.playerId) {
                    // we only care about other player gains
                    redGains[id] = afterRed[id] - beforeRed[id];
                }
            });
            this.server.in(data.game).emit(events.output.RED_CARD_EFFECTS, {
                newMoney: afterRed,
                gains: redGains,
                fromPlayer: data.playerId
            });

            setTimeout(() => {
                // TODO: check blue cards
                const beforeBlue: { [p: number]: number } = game.currentPlayerMoneyMap;
                game.triggerBlueCards();
                const afterBlue: { [p: number]: number } = game.currentPlayerMoneyMap;

                // now each player gets their own money, no stealing
                // [playerId]: coins
                const blueGains = {};
                Object.keys(afterBlue).forEach((id: string) => {
                    redGains[id] = afterBlue[id] - beforeBlue[id];
                });
                this.server.in(data.game).emit(events.output.BLUE_CARD_EFFECTS, {
                    newMoney: afterBlue,
                    gains: blueGains
                });
                setTimeout(() => {
                    // TODO: check green cards
                    // now only current player gets coins
                    const beforeGreen = game.currentPlayer.money;
                    game.triggerGreenCards();
                    const afterGreen = game.currentPlayer.money;
                    this.server.in(data.game).emit(events.output.GREEN_CARD_EFFECTS, {
                        player: data.playerId,
                        newMoney: afterGreen,
                        gains: afterGreen - beforeGreen
                    });

                    setTimeout(() => {
                        // TODO: check for Town Hall
                        // TODO: trigger purple cards
                        this.server.to(`${client.id}`).emit(events.output.BUILDING_POSSIBLE);
                    }, DEFAULT_DELAY);
                }, DEFAULT_DELAY);
            }, DEFAULT_DELAY);
        }, DEFAULT_DELAY);
    }

    @SubscribeMessage(events.input.BUY_CARD)
    async buyCard(@MessageBody() data: BuyCard,
                  @ConnectedSocket() client: Socket): Promise<void> {
        // add card to player, remove from the table, subtract money (and add to bank)
        this.h(data.game).buyCard(data.playerId, data.card);
        // does this really return undefined if we don't have a winner? it should...
        const winner = this.h(data.game).winner;
        if (winner !== undefined) {
            this.server.in(data.game).emit(events.output.PLAYER_WON_GAME, {
                playerId: winner
            });
            // TODO: end somehow
            return;
        }
        this.server.in(data.game).emit(events.output.PLAYER_BOUGHT_CARD, {
            player: data.playerId,
            card: data.card
        });
    }

    @SubscribeMessage(events.input.END_TURN)
    async endTurn(@MessageBody() data: EndTurn,
                  @ConnectedSocket() client: Socket): Promise<void> {

        const game = this.h(data.game);
        const hasAmusementPark = game.currentPlayer.cards.hasCard(CardName.AmusementPark);
        const latestDice = game.mostRecentRoll.dice;
        const sameDice = latestDice.length === 2 && latestDice[0] === latestDice[1];

        // TODO: check for Airport
        // const eligibleForAirport = false;
        const eligibleForAmusementPark = hasAmusementPark && sameDice;
        const newPlayerId = game.nextPlayerId;

        const triggerNewTurn = () => {
            game.setCurrentPlayer(newPlayerId);
            this.server.in(data.game).emit(events.output.NEW_TURN, {
                oldPlayer: data.playerId,
                newPlayer: newPlayerId
            });
        };
        const triggerAmusementPark = () =>
            this.server.in(data.game).emit(events.output.AMUSEMENT_PARK_NEW_TURN, {
                player: data.playerId
            });
        // const triggerAirportGain = () =>
        //     this.server.in(data.game).emit(events.output.AIRPORT_GAIN, {
        //         player: data.playerId
        //     });

        // if (eligibleForAirport) {
        //     triggerAirportGain();
        //     setTimeout(() => {
        //         if (eligibleForAmusementPark) {
        //             triggerAmusementPark();
        //         } else {
        //             triggerNewTurn();
        //         }
        //     }, DEFAULT_DELAY);
        // } else
        if (eligibleForAmusementPark) {
            triggerAmusementPark();
        } else {
            triggerNewTurn();
        }
    }

    g(id: string): Game {
        // since this.games[data.game].game is way too often used and way too long and repetitive, this is just a getter
        return this.games[id].game;
    }

    h(id: string): GameHandler {
        // same with handler
        return this.games[id].handler;
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
