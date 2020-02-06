import {
    bakery, wheatField,
    dominants
} from './cards';
import { CardCollection } from '@app/classes/cardCollection';

export class PlayerGameData {
    money: number;
    cards: CardCollection;

    constructor() {
        this.money = 3;
        this.cards = new CardCollection();
        this.cards.addCards(wheatField, bakery);
    }

    doesWin(): boolean {
        return dominants.map(card => card.cardName).every(name => this.cards.hasCard(name));
    }
}
