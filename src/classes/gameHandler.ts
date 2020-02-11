import { Server } from 'socket.io';
import { Game } from '@app/database/entities/game.entity';
import { PlayerGameData } from './playerGameData';
import {
    applePark,
    bakery,
    Card,
    CardColor,
    cardMap,
    CardName,
    coffeeShop,
    dairyShop,
    dominants,
    farm,
    forest,
    furnitureFactory,
    mall,
    mine,
    officeBuilding,
    restaurant,
    shop,
    stadium,
    televisionStudio,
    wheatField,
} from './cards';
import { CardCollection } from '@app/classes/cardCollection';

class GameData {
    bank: number;
    cards: CardCollection;

    constructor(playerCount: number) {
        this.bank = 210 - playerCount * 3;
        this.cards = new CardCollection();
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

    getPlayer(id: number|string): PlayerGameData {
        return this.playerData[id];
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
            Object.entries(player.cards.cards).forEach(([cardName, count]) => {
                const card: Card = cardMap[cardName];
                if (card.color !== CardColor.Red || !card.triggerNumbers.includes(this.mostRecentRoll.sum)) {
                    return;
                }
                for (let i = 0; i < count; i += 1) {
                    card.trigger(player, this);
                }
            });
        });
    }

    triggerBlueCards() {
        // for each card every player has (excluding dominants), call the card's trigger()
        Object.values(this.playerData).forEach((player) => {
            Object.entries(player.cards.cards).forEach(([cardName, count]) => {
                const card: Card = cardMap[cardName];
                if (card.color !== CardColor.Blue || !card.triggerNumbers.includes(this.mostRecentRoll.sum)) {
                    return;
                }
                for (let i = 0; i < count; i += 1) {
                    card.trigger(player, this);
                }
            });
        });
    }

    triggerGreenCards() {
        // for each card player has (excluding dominants), call the card's trigger()
        const player = this.currentPlayer;
        Object.entries(player.cards.cards).forEach(([cardName, count]) => {
            const card: Card = cardMap[cardName];
            if (card.color !== CardColor.Green || !card.triggerNumbers.includes(this.mostRecentRoll.sum)) {
                return;
            }
            for (let i = 0; i < count; i += 1) {
                card.trigger(player, this);
            }
        });
    }

    triggerPassivePurpleCards() {
        // TODO: implement Financial Office, Park and Publishing Office
        const stadium = cardMap[CardName.Stadium];
        if (this.currentPlayer.hasCard(stadium) && stadium.triggerNumbers.includes(this.mostRecentRoll.sum)) {
            stadium.trigger(this.currentPlayer, this);
        }
    }

    hasActivePurpleCards(): boolean {
        // TODO: add Water Treatment Plant (IT Center is special of specials, it can be triggered passively)
        const activeCards = [CardName.TelevisionStudio, CardName.OfficeBuilding];
        return activeCards.some(card => this.currentPlayer.hasCard(card));
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

    buyCard(playerId: number, card: CardName): void {
        // on server, dominants are treated as regular cards, but they're not on the table
        const cardObj = cardMap[card];
        this.playerData[playerId].addCard(card);
        if (!dominants.map(c => c.cardName).includes(card)) {
            this.gameData.cards.removeCard(card);
        }
        this.playerData[playerId].money -= cardObj.cost;
        this.gameData.bank += cardObj.cost;
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

    startGame() {
        // start the game - players are gathered, their money and cards are created/assigned in PlayerGameData constructor
        // game bank is filled in GameHandler constructor
        // starting player is generated and assigned in constructInitialData()
        // what's left - create buyable cards
        this.gameData.cards.addCards(
            [wheatField, 6],
            [farm, 6],
            [bakery, 6],
            [coffeeShop, 6],
            [shop, 6],
            [forest, 6],
            [stadium, 4],
            [televisionStudio, 4],
            [officeBuilding, 4],
            [dairyShop, 6],
            [furnitureFactory, 6],
            [mine, 6],
            [applePark, 6],
            [restaurant, 6],
            [mall, 6]
        );
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
        // TODO: this will probably change with expansions and might be generated elsewhere/at different time
        const buyableCards = [
            { card: CardName.WheatField, count: 6 },
            { card: CardName.Farm, count: 6 },
            { card: CardName.Bakery, count: 6 },
            { card: CardName.CoffeeShop, count: 6 },
            { card: CardName.Shop, count: 6 },
            { card: CardName.Forest, count: 6 },
            { card: CardName.Stadium, count: 4 },
            { card: CardName.TelevisionStudio, count: 4 },
            { card: CardName.OfficeBuilding, count: 4 },
            { card: CardName.DairyShop, count: 6 },
            { card: CardName.FurnitureFactory, count: 6 },
            { card: CardName.Mine, count: 6 },
            { card: CardName.ApplePark, count: 6 },
            { card: CardName.Restaurant, count: 6 },
            { card: CardName.Mall, count: 6 }
        ];
        const winningCards = [
            ...dominants.map(({ cardName }) => ({ card: cardName }))
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
