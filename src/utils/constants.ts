export const events = {
    lobby: {
        namespaceName: 'lobby',
        input: {
            PLAYER_ENTER: 'playerEnter',
            PLAYER_READY_STATUS: 'playerReadyStatus',
            PLAYER_LEFT: 'playerLeft'
        },
        output: {
            GAME_PLAYABLE: 'gamePlayable',
            PLAYER_ENTERED_LOBBY: 'playerEnteredLobby',
            PLAYER_CHANGED_READY_STATUS: 'playerChangedReadyStatus',
            PLAYER_LEFT_LOBBY: 'playerLeftLobby'
        }
    }
};
