import { Server, Socket } from 'socket.io';
import { Game } from '@app/database/entities/game.entity';
import { PlayerGameData } from './playerGameData';
import {
    Card,
    WheatField, Farm, Bakery, CoffeeShop, Shop,
    Forest, Stadium, TelevisionStudio, OfficeBuilding, DairyShop,
    FurnitureFactory, Mine, ApplePark, Restaurant, Mall,
    Station, ShoppingCenter, AmusementPark, Transmitter
} from './cards';

class GameData {
    bank: number;

    constructor(playerCount: number) {
        this.bank = 210 - playerCount * 3;
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
    swapCardOwn: new () => Card;    // Office building card swaps cards, use these 2 properties to refer to the card types
    swapCardTarget: new () => Card;

    constructor(game: Game, server: Server, socketIdMap: { [socketId: string]: number }) {
        this.game = game;
        this.server = server;
        this.gameData = new GameData(game.players.length);
        this.game.players.forEach((p) => {
            this.playerData[p.id] = new PlayerGameData();
        });
        this.socketIdMap = socketIdMap;
    }

    get currentPlayerId(): number {
        return this.socketIdMap[this.currentPlayerSocket.id];
    }

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

    setCardSwap<O extends Card, T extends Card >(own: new () => O, target: new () => T) {
        this.swapCardOwn = own;
        this.swapCardTarget = target;
    }

    resetTarget() {
        this.targetPlayer = null;
        this.swapCardTarget = null;
        this.swapCardOwn = null;
    }

    constructInitialData() {
        const players = this.game.players.map(player => ({
            id: player.id,
            name: player.name,
            cards: [
                { card: new WheatField(), count: 1 },
                { card: new Bakery(), count: 1 }
            ],
            money: 3
        }));
        const buyableCards = [
            { card: new WheatField(), count: 6 },
            { card: new Farm(), count: 6 },
            { card: new Bakery(), count: 6 },
            { card: new CoffeeShop(), count: 6 },
            { card: new Shop(), count: 6 },
            { card: new Forest(), count: 6 },
            { card: new Stadium(), count: 4 },
            { card: new TelevisionStudio(), count: 4 },
            { card: new OfficeBuilding(), count: 4 },
            { card: new DairyShop(), count: 6 },
            { card: new FurnitureFactory(), count: 6 },
            { card: new Mine(), count: 6 },
            { card: new ApplePark(), count: 6 },
            { card: new Restaurant(), count: 6 },
            { card: new Mall(), count: 6 }
        ];
        const winningCards = [
            new Station(), new ShoppingCenter(), new AmusementPark(), new Transmitter()
        ];
        const bank = this.gameData.bank;
        return {
            players,
            buyableCards,
            winningCards,
            bank
        };
    }
}
