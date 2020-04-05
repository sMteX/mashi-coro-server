export const events = {
    lobby: {
        namespaceName: 'lobby',
        input: {
            PLAYER_ENTER: 'playerEnter',
            PLAYER_READY_STATUS: 'playerReadyStatus',
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
    },
    game: {
        namespaceName: 'game',
        input: {
            PLAYER_CONNECT: 'playerConnect',
            DICE_ROLL: 'diceRoll', // beginning of the turn
            ADD_TWO: 'addTwo',
            END_ROLL: 'endRoll',
            LOGISTIC_COMPANY_INPUT: 'logisticCompanyInput',
            ACTIVE_PURPLE_CARDS_INPUT: 'activePurpleCardsInput',
            BUY_CARD: 'buyCard',
            END_TURN: 'endTurn'
        },
        output: {
            GAME_DATA_LOAD: 'gameDataLoad',
            GAME_STARTING: 'gameStarting',
            DICE_ROLL_OUTPUT: 'diceRollOutput',
            FINAL_DICE_ROLL: 'finalDiceRoll',
            RED_CARD_EFFECTS: 'redCardEffects',
            BLUE_CARD_EFFECTS: 'blueCardEffects',
            GREEN_CARD_EFFECTS: 'greenCardEffects',
            LOGISTICS_COMPANY_WAIT: 'logisticsCompanyWait',
            LOGISTICS_COMPANY_RESULT: 'logisticsCompanyResult',
            PASSIVE_PURPLE_CARD_EFFECTS: 'passivePurpleCardEffects',
            ACTIVE_PURPLE_CARD_WAIT: 'activePurpleCardWait',
            ACTIVE_PURPLE_CARD_RESULT: 'activePurpleCardResult',
            TOWN_HALL_GAIN: 'townHallGain',
            BUILDING_POSSIBLE: 'buildingPossible',
            PLAYER_BOUGHT_CARD: 'playerBoughtCard',
            IT_CENTER_COIN: 'itCenterCoin',
            AIRPORT_GAIN: 'airportGain',
            NEW_TURN: 'newTurn',
            AMUSEMENT_PARK_NEW_TURN: 'newTurnAmusement',
            PLAYER_LEFT_GAME: 'playerLeftGame',
            PLAYER_WON_GAME: 'playerWonGame',
            GAME_ENDED_EMPTY: 'gameEndedEmpty'
        }
    }
};
