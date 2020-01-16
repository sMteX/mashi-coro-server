export const events = {
    lobby: {
        namespaceName: 'lobby',
        input: {
            PLAYER_ENTER: 'playerEnter',
            PLAYER_READY_STATUS: 'playerReadyStatus',
            PLAYER_LEFT: 'playerLeft',
            GET_PLAYERS: 'getPlayers',
            START_GAME: 'startGame'
        },
        output: {
            GAME_PLAYABLE: 'gamePlayable',
            PLAYER_ENTERED_LOBBY: 'playerEnteredLobby',
            PLAYER_CHANGED_READY_STATUS: 'playerChangedReadyStatus',
            PLAYER_LEFT_LOBBY: 'playerLeftLobby',
            ALL_READY: 'allReady',
            GAME_STARTED: 'gameStarted'
        }
    }
};
