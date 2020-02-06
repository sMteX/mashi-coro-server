import { Card, CardColor, CardName, CardSymbol } from './card.interface';
import { GameHandler } from '../gameHandler';

export const wheatField: Card = {
    cardName: CardName.WheatField,
    name: 'Pšeničné pole',
    cost: 1,
    description: 'Vezměte si 1 minci z banku',
    symbol: CardSymbol.Wheat,
    color: CardColor.Blue,
    triggerNumbers: [1],

    trigger ({ currentPlayer, gameData }: GameHandler) {
        currentPlayer.money += 1;
        gameData.bank -= 1;
    }
};

export const farm: Card = {
    cardName: CardName.Farm,
    name: 'Statek',
    cost: 1,
    description: 'Vezměte si 1 minci z banku',
    symbol: CardSymbol.Pig,
    color: CardColor.Blue,
    triggerNumbers: [2],

    trigger ({ currentPlayer, gameData }: GameHandler) {
        currentPlayer.money += 1;
        gameData.bank -= 1;
    }
};

export const bakery: Card = {
    cardName: CardName.Bakery,
    name: 'Pekárna',
    cost: 1,
    description: 'Vezměte si 1 minci z banku',
    symbol: CardSymbol.Box,
    color: CardColor.Green,
    triggerNumbers: [2, 3],

    trigger ({ currentPlayer, gameData }: GameHandler) {
        const amount = currentPlayer.cards.hasCard(CardName.ShoppingCenter) ? 2 : 1;
        currentPlayer.money += amount;
        gameData.bank -= amount;
    }
};

export const coffeeShop: Card = {
    cardName: CardName.CoffeeShop,
    name: 'Kavárna',
    cost: 2,
    description: 'Dostanete 1 minci od hráče na tahu',
    symbol: CardSymbol.Coffee,
    color: CardColor.Red,
    triggerNumbers: [3],

    trigger ({ currentPlayer, otherPlayers }: GameHandler) {
        otherPlayers.forEach((player) => {
            for (let i = 0; i < player.cards.cardCount(CardName.CoffeeShop); i += 1) {
                // TODO: current player gives away money CLOCKWISE to other players, if he can
                const amount = player.cards.hasCard(CardName.ShoppingCenter) ? 2 : 1;
                currentPlayer.money -= amount;
                player.money += amount;
            }
        });
    }
};

export const shop: Card = {
    cardName: CardName.Shop,
    name: 'Samoobsluha',
    cost: 2,
    description: 'Vezměte si 3 mince z banku',
    symbol: CardSymbol.Box,
    color: CardColor.Green,
    triggerNumbers: [4],

    trigger ({ currentPlayer, gameData }: GameHandler) {
        const amount = currentPlayer.cards.hasCard(CardName.ShoppingCenter) ? 4 : 3;
        currentPlayer.money += amount;
        gameData.bank -= amount;
    }
};

export const forest: Card = {
    cardName: CardName.Forest,
    name: 'Les',
    cost: 3,
    description: 'Vezměte si 1 minci z banku',
    symbol: CardSymbol.Cog,
    color: CardColor.Blue,
    triggerNumbers: [5],

    trigger ({ currentPlayer, gameData }: GameHandler) {
        currentPlayer.money += 1;
        gameData.bank -= 1;
    }
};

// purple cards
export const stadium: Card = {
    cardName: CardName.Stadium,
    name: 'Stadión',
    cost: 6,
    description: 'Dostanete 2 mince od každého soupeře',
    symbol: CardSymbol.Tower,
    color: CardColor.Purple,
    triggerNumbers: [6],

    trigger ({ currentPlayer, otherPlayers }: GameHandler) {
        otherPlayers.forEach((player) => {
            // TODO: don't go to negative money
            player.money -= 2;
            currentPlayer.money += 2;
        });
    }
};

export const televisionStudio: Card = {
    cardName: CardName.TelevisionStudio,
    name: 'Televizní studio',
    cost: 7,
    description: 'Dostanete 5 mincí od zvoleného soupeře',
    symbol: CardSymbol.Tower,
    color: CardColor.Purple,
    triggerNumbers: [6],

    trigger ({ currentPlayer, targetPlayer }: GameHandler) {
        // TODO: don't go to negative money
        targetPlayer.money -= 5;
        currentPlayer.money += 5;
    }
};

export const officeBuilding: Card = {
    cardName: CardName.OfficeBuilding,
    name: 'Kancelářská budova',
    cost: 8,
    description: 'Můžete vyměnit jednu svoji kartu objektu za soupeřovu (nelze měnit Věže)',
    symbol: CardSymbol.Tower,
    color: CardColor.Purple,
    triggerNumbers: [6],

    trigger ({ currentPlayer, targetPlayer, swapCardOwn, swapCardTarget }: GameHandler) {
        // assume we have the card and the target has the card too
        currentPlayer.cards.removeCard(swapCardOwn);
        targetPlayer.cards.addCard(swapCardOwn);

        targetPlayer.cards.removeCard(swapCardTarget);
        currentPlayer.cards.addCard(swapCardTarget);
    }
};
//
export const dairyShop: Card = {
    cardName: CardName.DairyShop,
    name: 'Mlékárna',
    cost: 5,
    description: 'Za každý svůj objekt Prase si vezměte 3 mince z banku',
    symbol: CardSymbol.Factory,
    color: CardColor.Green,
    triggerNumbers: [7],

    trigger ({ currentPlayer, gameData }: GameHandler) {
        const symbolCount = currentPlayer.cards.symbolCount(CardSymbol.Pig);
        currentPlayer.money += symbolCount * 3;
        gameData.bank -= symbolCount * 3;
    }
};

export const furnitureFactory: Card = {
    cardName: CardName.FurnitureFactory,
    name: 'Továrna na nábytek',
    cost: 3,
    description: 'Za každý svůj objekt Kolečko si vezměte 3 mince z banku',
    symbol: CardSymbol.Factory,
    color: CardColor.Green,
    triggerNumbers: [8],

    trigger ({ currentPlayer, gameData }: GameHandler) {
        const symbolCount = currentPlayer.cards.symbolCount(CardSymbol.Cog);
        currentPlayer.money += symbolCount * 3;
        gameData.bank -= symbolCount * 3;
    }
};

export const mine: Card = {
    cardName: CardName.Mine,
    name: 'Důl',
    cost: 6,
    description: 'Vezměte si 5 mincí z banku',
    symbol: CardSymbol.Cog,
    color: CardColor.Blue,
    triggerNumbers: [9],

    trigger ({ currentPlayer, gameData }: GameHandler) {
        currentPlayer.money += 5;
        gameData.bank -= 5;
    }
};

export const applePark: Card = {
    cardName: CardName.ApplePark,
    name: 'Jabloňový sad',
    cost: 3,
    description: 'Vezměte si 3 mince z banku',
    symbol: CardSymbol.Wheat,
    color: CardColor.Blue,
    triggerNumbers: [10],

    trigger ({ currentPlayer, gameData }: GameHandler) {
        currentPlayer.money += 3;
        gameData.bank -= 3;
    }
};

export const restaurant: Card = {
    cardName: CardName.Restaurant,
    name: 'Restaurace',
    cost: 3,
    description: 'Dostanete 2 minci od hráče na tahu',
    symbol: CardSymbol.Coffee,
    color: CardColor.Red,
    triggerNumbers: [9, 10],

    trigger ({ currentPlayer, otherPlayers }: GameHandler) {
        otherPlayers.forEach((player) => {
            for (let i = 0; i < player.cards.cardCount(CardName.Restaurant); i += 1) {
                // TODO: current player gives away money CLOCKWISE to other players, if he can
                const amount = player.cards.hasCard(CardName.ShoppingCenter) ? 3 : 2;
                currentPlayer.money -= amount;
                player.money += amount;
            }
        });
    }
};

export const mall: Card = {
    cardName: CardName.Mall,
    name: 'Obchodní dům',
    cost: 2,
    description: 'Za každý svůj objekt Obilí si vezměte 2 mince z banku',
    symbol: CardSymbol.Other,
    color: CardColor.Green,
    triggerNumbers: [11, 12],

    trigger ({ currentPlayer, gameData }: GameHandler) {
        const symbolCount = currentPlayer.cards.symbolCount(CardSymbol.Wheat);
        currentPlayer.money += symbolCount * 2;
        gameData.bank -= symbolCount * 2;
    }
};

// Winning cards
export const station: Card = {
    cardName: CardName.Station,
    name: 'Nádraží',
    cost: 4,
    description: 'Můžete házet jednou nebo dvěma kostkami.',

    // irrelevant but necessary for typecheck
    symbol: CardSymbol.Tower,
    color: CardColor.Dominant,
    triggerNumbers: [],

    trigger (handler: GameHandler) {}
};

export const shoppingCenter: Card = {
    cardName: CardName.ShoppingCenter,
    name: 'Nákupní centrum',
    cost: 10,
    description: 'Dostáváte-li příjmy za objekty Kafe nebo Krabice, dostanete za každý z nich o 1 minci více.',

    // irrelevant but necessary for typecheck
    symbol: CardSymbol.Tower,
    color: CardColor.Dominant,
    triggerNumbers: [],

    trigger (handler: GameHandler) {}
};

export const amusementPark: Card = {
    cardName: CardName.AmusementPark,
    name: 'Zábavní park',
    cost: 16,
    description: 'Pokud vám při hodu dvěma kostkami padnou stejná čísla, máte tah navíc.',

    // irrelevant but necessary for typecheck
    symbol: CardSymbol.Tower,
    color: CardColor.Dominant,
    triggerNumbers: [],

    trigger (handler: GameHandler) {}
};

export const transmitter: Card = {
    cardName: CardName.Transmitter,
    name: 'Vysílač',
    cost: 22,
    description: 'Jednou v každém tahu smíte znovu hodit kostkami.',

    // irrelevant but necessary for typecheck
    symbol: CardSymbol.Tower,
    color: CardColor.Dominant,
    triggerNumbers: [],

    trigger (handler: GameHandler) {}
};

export const cardMap: { [index in CardName]: Card } = {
    [CardName.WheatField]: wheatField,
    [CardName.Farm]: farm,
    [CardName.Bakery]: bakery,
    [CardName.CoffeeShop]: coffeeShop,
    [CardName.Shop]: shop,
    [CardName.Forest]: forest,
    [CardName.Stadium]: stadium,
    [CardName.TelevisionStudio]: televisionStudio,
    [CardName.OfficeBuilding]: officeBuilding,
    [CardName.DairyShop]: dairyShop,
    [CardName.FurnitureFactory]: furnitureFactory,
    [CardName.Mine]: mine,
    [CardName.ApplePark]: applePark,
    [CardName.Restaurant]: restaurant,
    [CardName.Mall]: mall,
    [CardName.Station]: station,
    [CardName.ShoppingCenter]: shoppingCenter,
    [CardName.AmusementPark]: amusementPark,
    [CardName.Transmitter]: transmitter
};

export const dominants: Card[] = [station, shoppingCenter, amusementPark, transmitter];
