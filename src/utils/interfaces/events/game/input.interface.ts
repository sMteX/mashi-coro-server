import { CardName } from '@app/classes/cards';

interface BaseInput {
    game: string;
}
interface BaseGameInput extends BaseInput {
    playerId: number;
}
export interface PlayerConnect extends BaseInput {
    id: number;
}

export interface RollDice extends BaseGameInput {
    diceCount: 1 | 2;
    transmitter: boolean;
}

export interface AddTwo extends BaseGameInput {}

export interface EndRoll extends BaseGameInput {}

export interface LogisticCompanyInput extends BaseGameInput {
    args: { player: number; card: CardName }[];
}

export interface ActivePurpleCardsInput extends BaseGameInput {
    inputs: { [card in CardName]?: any };
}
export interface BuyCard extends BaseGameInput {
    card: CardName;
}
export interface EndTurn extends BaseGameInput {
    useItCenter: boolean;
}
