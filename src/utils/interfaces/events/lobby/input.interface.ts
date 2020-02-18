interface BaseInput {
    game: string;
}

export interface PlayerEnter extends BaseInput{
    playerName: string;
}

export interface PlayerReadyStatus extends BaseInput{
    ready: boolean;
}

export interface GetPlayers extends BaseInput {}

export interface StartGame extends BaseInput {}
