import * as Cards from './cards';
// tslint:disable-next-line:no-duplicate-imports
import {
    AmusementPark,
    Bakery, Card,
    CardSymbol,
    ShoppingCenter,
    Station,
    Transmitter,
    WheatField
} from './cards';

export class PlayerGameData {
    money: number;
    cards: { [card: string]: number};

    constructor() {
        this.money = 3;
        this.cards = {};
        this.addCard(WheatField);
        this.addCard(Bakery);
    }

    doesWin(): boolean {
        return [Station, ShoppingCenter, AmusementPark, Transmitter].every(card => this.hasCard(card));
    }

    // ugly syntax just so we can use it nicely
    hasCard<T extends Card>(card: new () => T): boolean {
        return this.cards[card.name] !== undefined;
    }

    addCard<T extends Card>(card: new () => T): void {
        if (this.cards[card.name] !== undefined) {
            this.cards[card.name] += 1;
        } else {
            this.cards[card.name] = 1;
        }
    }

    removeCard<T extends Card>(card: new () => T): void {
        // assume we have the card
        if (this.cards[card.name] === 1) {
            delete this.cards[card.name];
        } else {
            this.cards[card.name] -= 1;
        }
    }

    cardCount<T extends Card>(card: new () => T): number {
        return this.cards[card.name] || 0;
    }

    symbolCount(symbol: CardSymbol): number {
        let symCount = 0;
        Object.entries(this.cards).forEach(([cardName, count]) => {
            const card: Card = new Cards[cardName]();
            if (card.symbol === symbol) {
                symCount += count;
            }
        });
        return symCount;
    }
}
