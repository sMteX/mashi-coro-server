import { PlayerGameData } from './playerGameData';

export class Player {
    name: string;
    socketId: string;
    lobbyReady: boolean;
    gameData?: PlayerGameData;
}
