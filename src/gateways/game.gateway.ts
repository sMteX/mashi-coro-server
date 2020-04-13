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
import { events as eventConstants } from '@utils/constants';
import { GameHandler } from '@app/classes/gameHandler';
import {
    ActivePurpleCardsInput,
    AddTwo,
    BuyCard,
    EndRoll,
    EndTurn,
    LogisticCompanyInput,
    PlayerConnect,
    RollDice
} from '@utils/interfaces/events/game/input.interface';
import { Card, cardMap, CardName } from '@app/classes/cards';
import { Player } from '@app/database/entities/player.entity';

const { game: events } = eventConstants;
interface GamePair {
    game: Game;
    handler: GameHandler;
}
const DEFAULT_DELAY: number = 1000;

@WebSocketGateway({ namespace: events.namespaceName, transports: ['websocket'] })
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
        // first - we need to map from socket ID to player ID
        if (this.socketIdMap[client.id] === undefined) {
            // the client isn't even in the map, just return, there's nothing to be done
            return;
        }
        const playerId = this.socketIdMap[client.id];
        delete this.socketIdMap[client.id]; // 1)
        // select game (and its players), which contains given player (through inner select)
        let game: Game = await createQueryBuilder(Game, 'game')
            .innerJoinAndSelect('game.players', 'player')
            .where((qb) => {
                // find given player, select game ID
                const query = qb.subQuery()
                    .select('player."gameId"')
                    .from(Player, 'player')
                    .where('player.id = :id', { id: playerId })
                    .getQuery();
                return `game.id = ${query}`;
            })
            .getOne();
        if (!game) {
            // if there's only one player left, we already delete the game from DB
            // eventually the player will close the socket, but the game he was in no longer exists => game = undefined
            // his entry in socketIdMap was already deleted, just return
            return;
        }
        // second - remove player from DB
        game.players = game.players.filter(p => p.id !== playerId); // 2) at least it should work
        game = await this.gameRepository.save(game);
        this.games[game.slug].game = game;
        // if after removing we still have 2 players, just send echo that player left (and possibly another player is on turn)
        if (game.players.length >= 2) {
            const newPlayer = this.h(game.slug).removePlayer(playerId);
            if (newPlayer) {
                this.h(game.slug).setCurrentPlayer(newPlayer);
            }
            client.to(game.slug).emit(events.output.PLAYER_LEFT_GAME, {
                playerId,
                newPlayer
            });
        } else {
            const slug = game.slug;
            delete this.games[game.slug];
            await this.gameRepository.delete({
                slug: game.slug
            });
            client.to(slug).emit(events.output.GAME_ENDED_EMPTY);
        }
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
                this.server.in(data.game).emit(events.output.GAME_STARTING);
            }, DEFAULT_DELAY);
        }
    }

    @SubscribeMessage(events.input.DICE_ROLL)
    diceRoll(@MessageBody() data: RollDice,
                   @ConnectedSocket() client: Socket): void {
        // assume we can't call this in wrong situation - no checks for not having the specific cards
        const dice = this.h(data.game).rollDice(data.diceCount);
        this.server.in(data.game).emit(events.output.DICE_ROLL_OUTPUT, {
            dice,
            player: data.playerId,
            sum: dice[0] + (dice.length > 1 ? dice[1] : 0),
            transmitter: data.transmitter
        });
    }

    @SubscribeMessage(events.input.ADD_TWO)
    addTwo(@MessageBody() data: AddTwo,
                 @ConnectedSocket() client: Socket): void {
        this.h(data.game).mostRecentRoll.sum += 2;
        setTimeout(() => this.endRollAndTriggerCards(data, client), DEFAULT_DELAY);
    }

    @SubscribeMessage(events.input.END_ROLL)
    endRollAndTriggerCards(@MessageBody() data: EndRoll,
              @ConnectedSocket() client: Socket): void {
        const latestRoll = this.h(data.game).mostRecentRoll;
        this.server.in(data.game).emit(events.output.FINAL_DICE_ROLL, {
            player: data.playerId,
            dice: latestRoll.dice,
            sum: latestRoll.sum
        });

        this.checkAndTriggerRedCards(data, client);
    }

    checkAndTriggerRedCards(data: EndRoll, client: Socket) {
        const game = this.h(data.game);

        if (game.anyRedCardsTriggered()) {
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
            setTimeout(() => this.checkAndTriggerBlueCards(data, client), DEFAULT_DELAY);
        } else {
            this.checkAndTriggerBlueCards(data, client);
        }
    }

    checkAndTriggerBlueCards(data: EndRoll, client: Socket) {
        const game = this.h(data.game);

        if (game.anyBlueCardsTriggered()) {
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

            setTimeout(() => this.checkAndTriggerGreenCards(data, client), DEFAULT_DELAY);
        } else {
            this.checkAndTriggerGreenCards(data, client);
        }
    }

    checkAndTriggerGreenCards(data: EndRoll, client: Socket) {
        const game = this.h(data.game);

        if (game.anyGreenCardsTriggered()) {
            // only (possibly) trigger Logistics Company if it was active BEFORE triggering green cards
            // (because if it was inactive before, then triggerGreenCards() will reactivate it and it will look active anyway
            const shouldActivateLogisticsCompany = game.currentPlayer.isCardActive(CardName.LogisticsCompany);
            const wineryBefore = game.currentPlayer.isCardActive(CardName.Winery);
            // now only current player gets coins
            const beforeGreen = game.currentPlayer.money;
            game.triggerGreenCards();
            const afterGreen = game.currentPlayer.money;
            const wineryAfter = game.currentPlayer.isCardActive(CardName.Winery);

            let wineryToggled = false;
            if (game.isCardActivated(CardName.Winery) && (wineryBefore !== wineryAfter)) {
                // Winery was triggered and activated or deactivated, toggle it on the client too
                // should ignore situations where player doesn't have or can't use any Vineyard (the card can't be used = deactivated = state doesn't change)
                wineryToggled = true;
            }

            this.server.in(data.game).emit(events.output.GREEN_CARD_EFFECTS, {
                wineryToggled,
                player: data.playerId,
                newMoney: afterGreen,
                gains: afterGreen - beforeGreen
            });

            if (game.isCardActivated(CardName.LogisticsCompany) && shouldActivateLogisticsCompany) {
                this.server.to(`${client.id}`).emit(events.output.LOGISTICS_COMPANY_WAIT);
            } else {
                // this logic is repeated either here or after we received the input from Logistic company
                setTimeout(() => this.checkAndTriggerPurpleCards(data, client), DEFAULT_DELAY);
            }
        } else {
            this.checkAndTriggerPurpleCards(data, client);
        }
    }

    @SubscribeMessage(events.input.LOGISTIC_COMPANY_INPUT)
    logisticCompanyInput(@MessageBody() data: LogisticCompanyInput,
                         @ConnectedSocket() client: Socket): void {
        const game = this.h(data.game);
        // this should arrive only if it's actually not empty
        data.args.forEach(({ player, card: cardName }) => {
            const card: Card = cardMap[cardName];
            card.trigger(game.currentPlayer, game, { targetPlayerId: player, card: cardName });
        });
        this.server.in(data.game).emit(events.output.LOGISTICS_COMPANY_RESULT, {
            sourcePlayer: data.playerId,
            playersAndCards: data.args
        });
        setTimeout(() => this.checkAndTriggerPurpleCards(data, client), DEFAULT_DELAY);
    }

    checkAndTriggerPurpleCards(data: EndRoll, client: Socket): void {
        const game = this.h(data.game);

        if (game.anyPassivePurpleCardsTriggered()) {
            const beforePassivePurple = game.currentPlayerMoneyMap;
            game.triggerPassivePurpleCards();
            const afterPassivePurple = game.currentPlayerMoneyMap;

            // this tells us, that Park was activated (and all players' coins have been rebalanced), use different message on client
            const parkActivated = game.isCardActivated(CardName.Park);

            const passivePurpleResult = {};
            Object.keys(afterPassivePurple).forEach((id: string) => {
                if (Number(id) === data.playerId) {
                    // we only care about our gains
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
                parkActivated,
                result: passivePurpleResult,
                player: data.playerId
            });

            setTimeout(() => this.checkAndTriggerActivePurpleCards(data, client), DEFAULT_DELAY);
        } else {
            this.checkAndTriggerActivePurpleCards(data, client);
        }
    }

    checkAndTriggerActivePurpleCards(data: EndRoll, client: Socket) {
        const game = this.h(data.game);
        if (game.anyActivePurpleCardsTriggered()) {
            this.server.to(`${client.id}`).emit(events.output.ACTIVE_PURPLE_CARD_WAIT);
        } else {
            this.townHallCheck(data);
        }
    }

    @SubscribeMessage(events.input.ACTIVE_PURPLE_CARDS_INPUT)
    activePurpleCards(@MessageBody() data: ActivePurpleCardsInput,
                            @ConnectedSocket() client: Socket): void {
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
            } else if (cardEnum === CardName.WaterTreatmentPlant) {
                const card = args as CardName;
                results[cardEnum] = {
                    card,
                    currentPlayerId: data.playerId,
                    gain: afterCard[handler.currentPlayerId] - beforeCard[handler.currentPlayerId],
                    currentPlayerMoney: handler.currentPlayer.money
                };
            }
        });
        this.server.in(data.game).emit(events.output.ACTIVE_PURPLE_CARD_RESULT, { results });
        setTimeout(() => this.townHallCheck(data), DEFAULT_DELAY);
    }

    townHallCheck(data: EndRoll) {
        const game = this.h(data.game);
        if (game.currentPlayer.money === 0) {
            game.currentPlayer.money += 1;
            this.server.in(data.game).emit(events.output.TOWN_HALL_GAIN, {
                player: data.playerId
            });
        }
        this.server.in(data.game).emit(events.output.BUILDING_POSSIBLE);
    }

    @SubscribeMessage(events.input.BUY_CARD)
    async buyCard(@MessageBody() data: BuyCard,
                  @ConnectedSocket() client: Socket): Promise<void> {
        // add card to player, remove from the table, subtract money (and add to bank)
        const game = this.h(data.game);
        const drawnCards = game.buyCard(data.playerId, data.card);
        this.server.in(data.game).emit(events.output.PLAYER_BOUGHT_CARD, {
            drawnCards,
            player: data.playerId,
            card: data.card
        });
        // does this really return undefined if we don't have a winner? it should...
        const winner = this.h(data.game).winner;
        if (winner !== null) {
            this.server.in(data.game).emit(events.output.PLAYER_WON_GAME, {
                playerId: winner
            });
            // TODO: end somehow

            Object.entries(this.socketIdMap)
                .forEach(([socket, id]) => {
                    if (!game.playerIds.includes(id)) {
                        return;
                    }
                    delete this.socketIdMap[socket];
                });
            delete this.games[data.game];
            await this.gameRepository.delete({
                slug: data.game
            });
        }
    }

    @SubscribeMessage(events.input.END_TURN)
    endTurn(@MessageBody() data: EndTurn,
                  @ConnectedSocket() client: Socket): void {
        const game = this.h(data.game);

        if (data.useItCenter) {
            game.currentPlayer.money -= 1;
            game.currentPlayer.itCenterCoins += 1;
            this.server.in(data.game).emit(events.output.IT_CENTER_COIN, {
                player: data.playerId
            });
        }

        const hasAmusementPark = game.currentPlayer.hasCard(CardName.AmusementPark);
        const hasAirport = game.currentPlayer.hasCard(CardName.Airport);
        const latestDice = game.mostRecentRoll.dice;
        const sameDice = latestDice.length === 2 && latestDice[0] === latestDice[1];

        const eligibleForAirport = hasAirport && !game.airportJustBought && !game.boughtCardThisTurn;
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
        const triggerAirportGain = () => {
            game.currentPlayer.money += 10;
            this.server.in(data.game).emit(events.output.AIRPORT_GAIN, {
                player: data.playerId
            });
        };

        if (eligibleForAirport) {
            triggerAirportGain();
            setTimeout(() => {
                if (eligibleForAmusementPark) {
                    triggerAmusementPark();
                } else {
                    triggerNewTurn();
                }
            }, DEFAULT_DELAY);
        } else if (eligibleForAmusementPark) {
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
