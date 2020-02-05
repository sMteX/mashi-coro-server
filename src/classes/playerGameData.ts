import {
    bakery, wheatField,
    dominants,
    cardMap,
    Card, CardName, CardSymbol
} from './cards';

export class PlayerGameData {
    money: number;
    cards: { [card in CardName]?: number};

    constructor() {
        this.money = 3;
        this.cards = {};
        this.addCard(wheatField);
        this.addCard(bakery);
    }

    doesWin(): boolean {
        return dominants.map(card => card.cardName).every(name => this.hasCard(name));
    }

    private getName(card: Card|CardName): CardName {
        return typeof card === 'object' ? card.cardName : card;
    }

    hasCard(card: Card|CardName): boolean {
        return this.cards[this.getName(card)] !== undefined;
    }

    addCard(card: Card|CardName): void {
        const name = this.getName(card);
        if (this.cards[name] !== undefined) {
            this.cards[name] += 1;
        } else {
            this.cards[name] = 1;
        }
    }

    removeCard(card: Card|CardName): void {
        // assume we have the card
        const name = this.getName(card);
        if (this.cards[name] === 1) {
            delete this.cards[name];
        } else {
            this.cards[name] -= 1;
        }
    }

    cardCount(card: Card|CardName): number {
        const name = this.getName(card);
        return this.cards[name] || 0;
    }

    symbolCount(symbol: CardSymbol): number {
        let symCount = 0;
        // this.cards is keyed with values from CardName, but forEach returns string keys
        // enum = number = number string => other way around it's Number(key) as enum
        Object.entries(this.cards).forEach(([cardName, count]) => {
            const card: Card = cardMap[Number(cardName) as CardName];
            if (card.symbol === symbol) {
                symCount += count;
            }
        });
        return symCount;
    }
}
