import { PlayerGameData } from './playerGameData';

export class Player {
    name: string;
    socketId: string;

    gameData?: PlayerGameData;
}
