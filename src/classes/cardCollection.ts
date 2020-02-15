import { Card, cardMap, CardName, CardSymbol } from '@app/classes/cards';

type AddCardsType = (Card|CardName) | [Card|CardName, number];
export class CardCollection {
    cards: { [card in CardName]?: number };

    constructor() {
        this.cards = {};
    }

    private getName(card: Card|CardName): CardName {
        return typeof card === 'object' ? card.cardName : card;
    }

    hasCard(card: Card|CardName): boolean {
        return this.cards[this.getName(card)] !== undefined;
    }

    addCards(...cards: AddCardsType[]): void {
        cards.forEach((card) => {
            if (Array.isArray(card)) {
                const [c, count] = card;
                this.addCard(c, count);
            } else {
                this.addCard(card);
            }
        });
    }

    addCard(card: Card|CardName, amount: number = 1): void {
        const name = this.getName(card);
        if (this.cards[name] !== undefined) {
            this.cards[name] += amount;
        } else {
            this.cards[name] = amount;
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
