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
import {
    ActivePurpleCardsInput,
    BuyCard,
    EndRoll,
    EndTurn,
    PlayerConnect,
    RollDice
} from '@utils/interfaces/events/game/input.interface';
import { Card, cardMap, CardName } from '@app/classes/cards';

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
        // TODO: fix this, breaks all the time
        return;
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
            const beforeRed: { [p: number]: number } = game.currentPlayerMoneyMap;
            game.triggerRedCards();
            const afterRed: { [p: number]: number } = game.currentPlayerMoneyMap;

            // in here, others get coins from current player, so redGains contains how many coins OTHERS get from current player
            // [playerId]: {gains?, newMoney}
            const redResult = {};
            Object.keys(afterRed).forEach((id: string) => {
                if (Number(id) !== data.playerId) {
                    // we only care about other player gains
                    redResult[id] = {
                        gains: afterRed[id] - beforeRed[id],
                        newMoney: afterRed[id]
                    };
                } else {
                    redResult[id] = {
                        newMoney: afterRed[id]
                    };
                }
            });
            this.server.in(data.game).emit(events.output.RED_CARD_EFFECTS, {
                result: redResult,
                fromPlayer: data.playerId
            });

            setTimeout(() => {
                const beforeBlue: { [p: number]: number } = game.currentPlayerMoneyMap;
                game.triggerBlueCards();
                const afterBlue: { [p: number]: number } = game.currentPlayerMoneyMap;

                // now each player gets their own money, no stealing
                // [playerId]: { gains, newMoney }
                const blueResult = {};
                Object.keys(afterBlue).forEach((id: string) => {
                    blueResult[id] = {
                        gains: afterBlue[id] - beforeBlue[id],
                        newMoney: afterBlue[id]
                    };
                });
                this.server.in(data.game).emit(events.output.BLUE_CARD_EFFECTS, {
                    result: blueResult
                });
                setTimeout(() => {
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
                        const beforePassivePurple = game.currentPlayerMoneyMap;
                        game.triggerPassivePurpleCards();
                        const afterPassivePurple = game.currentPlayerMoneyMap;

                        const passivePurpleResult = {};
                        Object.keys(afterPassivePurple).forEach((id: string) => {
                            if (Number(id) === data.playerId) {
                                // we only care about our gains
                                // TODO: rework after Park is implemented (balancing all players' coins)
                                // or just send all the data all the time and let client handle the display..
                                passivePurpleResult[id] = {
                                    gains: afterPassivePurple[id] - beforePassivePurple[id],
                                    newMoney: afterPassivePurple[id]
                                };
                            } else {
                                passivePurpleResult[id] = {
                                    newMoney: afterPassivePurple[id]
                                };
                            }
                        });

                        this.server.in(data.game).emit(events.output.PASSIVE_PURPLE_CARD_EFFECTS, {
                            result: passivePurpleResult,
                            player: data.playerId
                        });

                        if (game.hasActivePurpleCards()) {
                            this.server.to(`${client.id}`).emit(events.output.ACTIVE_PURPLE_CARD_WAIT);
                        } else {
                            // TODO: check for Town Hall (before building)
                            this.server.in(data.game).emit(events.output.BUILDING_POSSIBLE);
                        }
                    }, DEFAULT_DELAY);
                }, DEFAULT_DELAY);
            }, DEFAULT_DELAY);
        }, DEFAULT_DELAY);
    }

    @SubscribeMessage(events.input.ACTIVE_PURPLE_CARDS_INPUT)
    async activePurpleCards(@MessageBody() data: ActivePurpleCardsInput,
                            @ConnectedSocket() client: Socket): Promise<void> {
        const handler = this.h(data.game);
        const results: {[key in CardName]?: any} = {};
        // this should arrive only if it's actually not empty
        Object.entries(data.inputs).forEach(([cardName, args]) => {
            const card: Card = cardMap[cardName];
            const beforeCard = handler.currentPlayerMoneyMap;
            card.trigger(handler.currentPlayer, handler, args);
            const afterCard = handler.currentPlayerMoneyMap;

            /*
            Active cards and their results:
                6 - Office Building - current player and target player will swap one card
                    - return object might be the same - target player, my card, his card (and on client, swap those cards same as here)
                6 - Stadium - current player gets 5 coins from target player
                    - again, same return object (+ current player's new coins)

                8 - Water Treatment Plant - current player names a card (CardName pretty much) and all player's cards of the same name are KO'd
                    - return - just the CardName??
                10 - IT Center - technically a passive card (but is checked for before end of turn), so probably don't return anything here
             */
            const cardEnum = Number(cardName) as CardName;
            if (cardEnum === CardName.OfficeBuilding) {
                // args:
                //  targetPlayerId: number;
                //  swapCardOwn: CardName;
                //  swapCardTarget: CardName;
                results[cardEnum] = {
                    ...args,
                    currentPlayerId: data.playerId
                };
            } else if (cardEnum === CardName.TelevisionStudio) {
                const targetPlayerId = args as number;
                results[cardEnum] = {
                    targetPlayerId,
                    currentPlayerId: data.playerId,
                    gain: afterCard[handler.currentPlayerId] - beforeCard[handler.currentPlayerId],
                    currentPlayerMoney: handler.currentPlayer.money,
                    targetPlayerMoney: handler.getPlayer(targetPlayerId).money
                };
            }
        });
        this.server.in(data.game).emit(events.output.ACTIVE_PURPLE_CARD_RESULT, { results });
        setTimeout(() => {
            // TODO: technically check for Town Hall (no coins before building = 1 coin)
            //  but I think it's not necessary = this gets triggered only if some cards are ACTUALLY triggered
            //  and all of them somehow generate coins
            this.server.in(data.game).emit(events.output.BUILDING_POSSIBLE);
        }, DEFAULT_DELAY);
    }

    @SubscribeMessage(events.input.BUY_CARD)
    async buyCard(@MessageBody() data: BuyCard,
                  @ConnectedSocket() client: Socket): Promise<void> {
        // add card to player, remove from the table, subtract money (and add to bank)
        this.h(data.game).buyCard(data.playerId, data.card);
        // does this really return undefined if we don't have a winner? it should...
        const winner = this.h(data.game).winner;
        if (winner !== null) {
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
        const eligibleForAmusementPark = hasAmusementPark && sameDice && !game.amusementParkJustBought;
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
