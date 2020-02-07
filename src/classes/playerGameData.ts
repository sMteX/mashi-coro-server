import {
    bakery, wheatField,
    dominants, Card, CardName, CardSymbol
} from './cards';
import { CardCollection } from '@app/classes/cardCollection';

// TODO: duplicate in cardCollection
type AddCardsType = (Card|CardName) | [Card|CardName, number];

export class PlayerGameData {
    money: number;
    cards: CardCollection;

    constructor() {
        this.money = 3;
        this.cards = new CardCollection();
        this.addCards(wheatField, bakery);
    }

    doesWin(): boolean {
        return dominants.map(card => card.cardName).every(name => this.hasCard(name));
    }

    hasCard(card: Card|CardName): boolean {
        return this.cards.hasCard(card);
    }

    addCards(...cards: AddCardsType[]): void {
        this.cards.addCards(...cards);
    }

    addCard(card: Card|CardName, amount: number = 1): void {
        this.cards.addCard(card, amount);
    }

    removeCard(card: Card|CardName): void {
        this.cards.removeCard(card);
    }

    cardCount(card: Card|CardName): number {
        return this.cards.cardCount(card);
    }

    symbolCount(symbol: CardSymbol): number {
        return this.cards.symbolCount(symbol);
    }
}
