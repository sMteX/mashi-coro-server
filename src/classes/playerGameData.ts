import { bakery, Card, CardName, CardSymbol, dominants, townHall, wheatField } from './cards';
import { CardCollection } from '@app/classes/cardCollection';

// TODO: duplicate in cardCollection
type AddCardsType = (Card|CardName) | [Card|CardName, number];

export class PlayerGameData {
    money: number;
    cards: CardCollection;
    itCenterCoins: number; // don't really know where to put this as it's specific to each player and it can be active only once

    constructor() {
        this.money = 3;
        this.itCenterCoins = 0;
        this.cards = new CardCollection();
        this.addCards(townHall, wheatField, bakery);
    }

    doesWin(): boolean {
        return dominants.map(card => card.cardName).every(name => this.hasCard(name));
    }

    dominantCount(withTownHall: boolean = false): number {
        return dominants.map(card => card.cardName).filter((name) => {
            if (name === CardName.TownHall) {
                if (withTownHall) {
                    return this.hasCard(name);
                }
            } else {
                return this.hasCard(name);
            }
        }).length;
    }

    deactivateCard(card: Card|CardName): void {
        this.cards.deactivate(card);
    }

    activateCard(card: Card|CardName): void {
        this.cards.activate(card);
    }

    isCardActive(card: Card|CardName): boolean {
        return this.cards.isActive(card);
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
