import { Server, Socket } from 'socket.io';
import { Game } from '@app/database/entities/game.entity';
import { PlayerGameData } from './playerGameData';
import {
    wheatField, farm, bakery, coffeeShop, shop, forest,
    stadium, televisionStudio, officeBuilding, dairyShop,
    furnitureFactory, mine, applePark, restaurant, mall, dominants, CardName
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
    currentPlayerSocket!: Socket;
    game: Game;

    socketIdMap: { [socket: string]: number } = {};
    playerData: { [id: number]: PlayerGameData } = {};
    gameData: GameData;

    targetPlayer: PlayerGameData;    // some cards require targeting a player
    swapCardOwn: CardName;    // Office building card swaps cards, use these 2 properties to refer to the card types
    swapCardTarget: CardName;

    currentPlayerId: number;
    mostRecentRoll: {
        player: number;
        dice: number[]
    };

    constructor(game: Game, server: Server, socketIdMap: { [socketId: string]: number }) {
        this.game = game;
        this.server = server;
        this.gameData = new GameData(game.players.length);
        this.game.players.forEach((p) => {
            this.playerData[p.id] = new PlayerGameData();
        });
        this.socketIdMap = socketIdMap;
    }

    // get currentPlayerId(): number {
    //     return this.socketIdMap[this.currentPlayerSocket.id];
    // }

    get currentPlayer(): PlayerGameData {
        return this.playerData[this.currentPlayerId];
    }

    get otherPlayers(): PlayerGameData[] {
        const currentId = this.currentPlayerId;
        return Object.entries(this.playerData)
            .filter(([id]) => Number(id) !== currentId)
            .map(([, data]) => data);
    }

    setCurrentPlayer(player: Socket) {
        this.currentPlayerSocket = player;
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

    rollDice(amount: number): number[] {
        const dice = [];
        dice.push(Math.floor(Math.random() * 6) + 1);
        if (amount === 2) {
            dice.push(Math.floor(Math.random() * 6) + 1);
        }
        this.mostRecentRoll.player = this.currentPlayerId;
        this.mostRecentRoll.dice = [...dice];
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
        const players = this.game.players.map(player => ({
            id: player.id,
            socketId: idSocketMap[player.id],
            name: player.name,
            cards: [
                { card: wheatField, count: 1 },
                { card: bakery, count: 1 }
            ],
            money: 3
        }));
        const buyableCards = [
            { card: wheatField, count: 6 },
            { card: farm, count: 6 },
            { card: bakery, count: 6 },
            { card: coffeeShop, count: 6 },
            { card: shop, count: 6 },
            { card: forest, count: 6 },
            { card: stadium, count: 4 },
            { card: televisionStudio, count: 4 },
            { card: officeBuilding, count: 4 },
            { card: dairyShop, count: 6 },
            { card: furnitureFactory, count: 6 },
            { card: mine, count: 6 },
            { card: applePark, count: 6 },
            { card: restaurant, count: 6 },
            { card: mall, count: 6 }
        ];
        const winningCards = [
            ...dominants
        ];
        const bank = this.gameData.bank;
        const startingPlayerId = this.game.players[Math.floor(Math.random() * this.game.players.length)].id;
        this.currentPlayerId = startingPlayerId;
        return {
            players,
            buyableCards,
            winningCards,
            bank,
            startingPlayerId
        };
    }
}
