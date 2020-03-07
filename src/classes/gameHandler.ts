import * as _ from 'lodash';
import { Server } from 'socket.io';
import { Game } from '@app/database/entities/game.entity';
import { PlayerGameData } from './playerGameData';
import {
    activePurpleCards, blueCards,
    Card,
    CardColor,
    cardMap,
    CardName,
    dominants, greenCards,
    passivePurpleCards,
    redCards,
} from './cards';
import { CardCollection } from '@app/classes/cardCollection';

class GameData {
    bank: number;
    lowCards: CardCollection;
    highCards: CardCollection;
    purpleCards: CardCollection;

    // these arrays represent piles, that we draw from
    lowCardsPile: CardName[];
    highCardsPile: CardName[];
    purpleCardsPile: CardName[];
    constructor(playerCount: number) {
        this.bank = 210 - playerCount * 3;
        this.lowCards = new CardCollection();
        this.highCards = new CardCollection();
        this.purpleCards = new CardCollection();
        this.lowCardsPile = [];
        this.highCardsPile = [];
        this.purpleCardsPile = [];
    }

    removeCard(card: CardName): void {
        const cardObj = cardMap[card];
        if (cardObj.color === CardColor.Purple) {
            this.purpleCards.removeCard(card);
        } else {
            const avg = cardObj.triggerNumbers.reduce((acc, cur) => acc + cur, 0) / cardObj.triggerNumbers.length;
            if (avg <= 6) {
                this.lowCards.removeCard(card);
            } else {
                this.highCards.removeCard(card);
            }
        }
    }
}

export class GameHandler {
    server: Server;
    // currentPlayerSocket!: Socket;
    game: Game;

    socketIdMap: { [socket: string]: number } = {};
    playerData: { [id: number]: PlayerGameData } = {};
    // stores ids of players... also serves to dictate the order of players
    playerIds: number[] = [];
    gameData: GameData;

    targetPlayer: PlayerGameData;    // some cards require targeting a player
    swapCardOwn: CardName;    // Office building card swaps cards, use these 2 properties to refer to the card types
    swapCardTarget: CardName;

    currentPlayerId: number;
    mostRecentRoll: {
        player: number;
        dice: number[];
        sum: number;
    };
    amusementParkJustBought: boolean = false;
    airportJustBought: boolean = false;
    boughtCardThisTurn: boolean = false;

    constructor(game: Game, server: Server, socketIdMap: { [socketId: string]: number }) {
        this.game = game;
        this.server = server;
        this.gameData = new GameData(game.players.length);
        this.game.players.forEach((p) => {
            this.playerIds.push(p.id);
            this.playerData[p.id] = new PlayerGameData();
        });
        this.socketIdMap = socketIdMap;
    }

    // get currentPlayerId(): number {
    //     return this.socketIdMap[this.currentPlayerSocket.id];
    // }
    removePlayer(id: number): number {
        let nextPlayer: number;
        if (this.currentPlayerId === id) {
            nextPlayer = this.nextPlayerId;
        }
        delete this.playerData[id];
        this.playerIds = this.playerIds.filter(i => i !== id);
        return nextPlayer;
    }
    getPlayer(id: number|string): PlayerGameData {
        return this.playerData[id];
    }

    get allPlayers(): PlayerGameData[] {
        return Object.values(this.playerData);
    }

    get currentPlayer(): PlayerGameData {
        return this.getPlayer(this.currentPlayerId);
    }

    get otherPlayers(): PlayerGameData[] {
        return Object.entries(this.playerData)
            .filter(([id]) => Number(id) !== this.currentPlayerId)
            .map(([, data]) => data);
    }

    setCurrentPlayer(player: number) {
        this.currentPlayerId = player;
        this.amusementParkJustBought = false;
        this.airportJustBought = false;
        this.boughtCardThisTurn = false;
    }

    get nextPlayerId(): number {
        // get array index of current player, return id of next player
        const currentPlayerIndex = this.playerIds.indexOf(this.currentPlayerId);
        const next = currentPlayerIndex + 1;
        if (next === this.playerIds.length) {
            return this.playerIds[0];
        }
        return this.playerIds[next];
    }

    get winner(): number|null {
        let winnerId: number = null;
        Object.entries(this.playerData).forEach(([id, data]) => {
            if (data.doesWin()) {
                winnerId = Number(id);
                return;
            }
        });
        return winnerId;
    }

    get currentPlayerMoneyMap(): { [id: number]: number } {
        const map = {};
        Object.entries(this.playerData).forEach(([id, data]) => {
            map[id] = data.money;
        });
        return map;
    }

    private antiClockwisePlayers(playerId: number): PlayerGameData[] {
        /*
        example

        indexes:
            0, 1, 2, 3

        current player = 2

        anti-clockwise order of remaining = 1, 0, 3
         */
        const index = this.playerIds.indexOf(playerId);
        const antiClockwiseOrder = [];
        for (let i = index - 1; i >= 0; i -= 1) {
            antiClockwiseOrder.push(i);
        }
        for (let i = this.playerIds.length - 1; i > index; i -= 1) {
            antiClockwiseOrder.push(i);
        }
        return antiClockwiseOrder.map(index => this.playerData[this.playerIds[index]]);
    }

    triggerRedCards() {
        const acOrder = this.antiClockwisePlayers(this.currentPlayerId);
        acOrder.forEach((player) => {
            Object.entries(player.cards.cards).forEach(([cardName, { active, count }]) => {
                const card: Card = cardMap[cardName];
                if (card.color !== CardColor.Red || !card.triggerNumbers.includes(this.mostRecentRoll.sum)) {
                    return;
                }
                if (!active) {
                    player.activateCard(card);
                } else {
                    for (let i = 0; i < count; i += 1) {
                        card.trigger(player, this);
                    }
                }
            });
        });
    }

    triggerBlueCards() {
        // Fishing Ship has a little different flow - the card gets triggered with the same dice roll for everyone
        // we assume that someone has it, pre-generate 2 dice roll, and trigger the card with that particular roll
        const fishingShipRoll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
        // for each card every player has (excluding dominants), call the card's trigger()
        Object.values(this.playerData).forEach((player) => {
            Object.entries(player.cards.cards).forEach(([cardName, { active, count }]) => {
                const card: Card = cardMap[cardName];
                if (card.color !== CardColor.Blue || !card.triggerNumbers.includes(this.mostRecentRoll.sum)) {
                    return;
                }
                if (!active) {
                    player.activateCard(card);
                } else {
                    for (let i = 0; i < count; i += 1) {
                        if (card.cardName === CardName.FishingShip) {
                            card.trigger(player, this, fishingShipRoll);
                        } else {
                            card.trigger(player, this);
                        }
                    }
                }
            });
        });
    }

    triggerGreenCards() {
        // for each card player has (excluding dominants), call the card's trigger()
        const player = this.currentPlayer;
        Object.entries(player.cards.cards).forEach(([cardName, { active, count }]) => {
            const card: Card = cardMap[cardName];
            if (card.cardName === CardName.LogisticsCompany) {
                return; // Logistic Company has special treatment after this method ends
            }
            if (card.color !== CardColor.Green || !card.triggerNumbers.includes(this.mostRecentRoll.sum)) {
                return;
            }
            if (!active) {
                player.activateCard(card);
            } else {
                for (let i = 0; i < count; i += 1) {
                    card.trigger(player, this);
                }
            }
        });
    }

    triggerPassivePurpleCards() {
        passivePurpleCards.forEach((cardName) => {
            const card = cardMap[cardName];
            if (this.currentPlayer.hasCard(cardName) && card.triggerNumbers.includes(this.mostRecentRoll.sum)) {
                card.trigger(this.currentPlayer, this);
            }
        });
    }

    anyRedCardsTriggered(): boolean {
        return this.otherPlayers.some(player => redCards.some(card => this.isCardActivated(card, player)));
    }

    anyBlueCardsTriggered(): boolean {
        return this.allPlayers.some(player => blueCards.some(card => this.isCardActivated(card, player)));
    }

    anyGreenCardsTriggered(): boolean {
        return greenCards.some(card => this.isCardActivated(card));
    }

    anyPassivePurpleCardsTriggered(): boolean {
        return passivePurpleCards.some(card => this.isCardActivated(card));
    }

    anyActivePurpleCardsTriggered(): boolean {
        return activePurpleCards.some(card => this.isCardActivated(card));
    }

    isCardActivated (card: CardName, player: PlayerGameData = this.currentPlayer): boolean {
        return player.hasCard(card) && cardMap[card].triggerNumbers.includes(this.mostRecentRoll.sum);
    }

    setTargetPlayer(id: number) {
        this.targetPlayer = this.playerData[id];
    }

    setCardSwap(own: CardName, target: CardName) {
        this.swapCardOwn = own;
        this.swapCardTarget = target;
    }

    resetTarget() {
        this.targetPlayer = null;
        this.swapCardTarget = null;
        this.swapCardOwn = null;
    }

    buyCard(playerId: number, card: CardName): CardName[] {
        // on server, dominants are treated as regular cards, but they're not on the table
        const cardObj = cardMap[card];
        this.playerData[playerId].addCard(card);
        if (!dominants.map(c => c.cardName).includes(card)) {
            this.gameData.removeCard(card);
        }
        this.playerData[playerId].money -= cardObj.cost;
        this.gameData.bank += cardObj.cost;

        this.boughtCardThisTurn = true;
        // flags to disable a dominant's effect the turn it's been bought:
        if (card === CardName.AmusementPark) {
            this.amusementParkJustBought = true;
        } else if (card === CardName.Airport) {
            this.airportJustBought = true;
        }

        const drawnCards = [];
        while (this.gameData.lowCards.uniqueCardCount < 5) {
            const c = this.gameData.lowCardsPile.pop();
            this.gameData.lowCards.addCard(c);
            drawnCards.push(c);
        }
        while (this.gameData.highCards.uniqueCardCount < 5) {
            const c = this.gameData.highCardsPile.pop();
            this.gameData.highCards.addCard(c);
            drawnCards.push(c);
        }
        while (this.gameData.purpleCards.uniqueCardCount < 2) {
            const c = this.gameData.purpleCardsPile.pop();
            this.gameData.purpleCards.addCard(c);
            drawnCards.push(c);
        }
        return drawnCards;
    }

    rollDice(amount: number): number[] {
        const dice = [];
        let sum = 0;
        dice.push(Math.floor(Math.random() * 6) + 1);
        sum += dice[0];
        if (amount === 2) {
            dice.push(Math.floor(Math.random() * 6) + 1);
            sum += dice[1];
        }
        this.mostRecentRoll = {
            sum,
            player: this.currentPlayerId,
            dice: [...dice]
        };
        return dice;
    }

    generateStartingCards () {
        const avg = (a: number[]) => a.reduce((acc, cur) => acc + cur, 0) / (a.length || 1);
        // 1) All cards are separated into 3 categories - low cards, high cards and purple cards
        Object.values(cardMap).forEach((card) => {
            if (card.color === CardColor.Dominant) {
                return;
            }
            if (card.color === CardColor.Purple) {
                this.gameData.purpleCardsPile.push(...Array(4).fill(card.cardName));
                return;
            }
            const repeatedCards = Array(6).fill(card.cardName);
            if (avg(card.triggerNumbers) <= 6) {
                this.gameData.lowCardsPile.push(...repeatedCards);
            } else {
                this.gameData.highCardsPile.push(...repeatedCards);
            }
        });
        // 2) each category is shuffled independently
        this.gameData.lowCardsPile = _.shuffle(this.gameData.lowCardsPile);
        this.gameData.highCardsPile = _.shuffle(this.gameData.highCardsPile);
        this.gameData.purpleCardsPile = _.shuffle(this.gameData.purpleCardsPile);
        // 3) draw cards from each category, until there are 5 different low cards, 5 different high cards and 2 different purple cards
        const lowCards: {[card in CardName]?: number} = {};
        const highCards: {[card in CardName]?: number} = {};
        const purpleCards: {[card in CardName]?: number} = {};

        while (Object.keys(lowCards).length < 5) {
            const card = this.gameData.lowCardsPile.pop();
            lowCards[card] = (lowCards[card] || 0) + 1;
        }
        while (Object.keys(highCards).length < 5) {
            const card = this.gameData.highCardsPile.pop();
            highCards[card] = (highCards[card] || 0) + 1;
        }
        while (Object.keys(purpleCards).length < 2) {
            const card = this.gameData.purpleCardsPile.pop();
            purpleCards[card] = (purpleCards[card] || 0) + 1;
        }
        return {
            lowCards,
            highCards,
            purpleCards
        };
    }

    constructInitialData() {
        const idSocketMap = {};
        Object.entries(this.socketIdMap).forEach(([socket, id]) => {
            idSocketMap[id] = socket;
        });
        const cardDb: { [name in CardName]: Card } = Object.assign({}, cardMap);
        const players = this.game.players.map(player => ({
            id: player.id,
            socketId: idSocketMap[player.id],
            name: player.name,
            cards: [
                { card: CardName.WheatField, count: 1 },
                { card: CardName.Bakery, count: 1 }
            ],
            money: 3
        }));

        const buyableCards = [];

        // generate buyable cards, save them here in handler and also send to the clients
        const { lowCards, highCards, purpleCards } = this.generateStartingCards();
        Object.entries(lowCards).forEach(([cardName, count]) => {
            const cardEnum = Number(cardName) as CardName;
            this.gameData.lowCards.addCard(cardEnum, count);
            buyableCards.push({ count, card: cardEnum });
        });
        Object.entries(highCards).forEach(([cardName, count]) => {
            const cardEnum = Number(cardName) as CardName;
            this.gameData.highCards.addCard(cardEnum, count);
            buyableCards.push({ count, card: cardEnum });
        });
        Object.entries(purpleCards).forEach(([cardName, count]) => {
            const cardEnum = Number(cardName) as CardName;
            this.gameData.purpleCards.addCard(cardEnum, count);
            buyableCards.push({ count, card: cardEnum });
        });

        const winningCards = [
            ...dominants.map(({ cardName }) => cardName)
        ];
        const bank = this.gameData.bank;
        const startingPlayerId = this.playerIds[Math.floor(Math.random() * this.game.players.length)];
        this.currentPlayerId = startingPlayerId;
        return {
            players,
            cardDb,
            buyableCards,
            winningCards,
            bank,
            startingPlayerId
        };
    }
}
