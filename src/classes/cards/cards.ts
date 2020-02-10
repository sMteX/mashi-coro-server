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

    trigger (owner, { gameData }) {
        owner.money += 1;
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

    trigger (owner, { gameData }) {
        owner.money += 1;
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

    trigger (owner, { gameData }) {
        const amount = owner.hasCard(CardName.ShoppingCenter) ? 2 : 1;
        owner.money += amount;
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

    trigger (owner, { currentPlayer }) {
        const amount = owner.hasCard(CardName.ShoppingCenter) ? 2 : 1;
        const realAmount = Math.min(amount, currentPlayer.money);
        currentPlayer.money -= realAmount;
        owner.money += realAmount;
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

    trigger (owner, { gameData }) {
        const amount = owner.hasCard(CardName.ShoppingCenter) ? 4 : 3;
        owner.money += amount;
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

    trigger (owner, { gameData }) {
        owner.money += 1;
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

    trigger (owner, { otherPlayers }) {
        otherPlayers.forEach((player) => {
            const amount = Math.min(2, player.money);
            player.money -= amount;
            owner.money += amount;
        });
    }
};
// TODO: these two require special communication - choosing target player
//  works now, but we need something more general for other cards too
export const televisionStudio: Card = {
    cardName: CardName.TelevisionStudio,
    name: 'Televizní studio',
    cost: 7,
    description: 'Dostanete 5 mincí od zvoleného soupeře',
    symbol: CardSymbol.Tower,
    color: CardColor.Purple,
    triggerNumbers: [6],

    trigger (owner, { targetPlayer }) {
        const amount = Math.min(5, targetPlayer.money);
        targetPlayer.money -= amount;
        owner.money += amount;
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

    trigger (owner, { targetPlayer, swapCardOwn, swapCardTarget }) {
        // assume we have the card and the target has the card too
        owner.removeCard(swapCardOwn);
        targetPlayer.addCard(swapCardOwn);

        targetPlayer.removeCard(swapCardTarget);
        owner.addCard(swapCardTarget);
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

    trigger (owner, { gameData }) {
        const symbolCount = owner.symbolCount(CardSymbol.Pig);
        owner.money += symbolCount * 3;
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

    trigger (owner, { gameData }) {
        const symbolCount = owner.symbolCount(CardSymbol.Cog);
        owner.money += symbolCount * 3;
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

    trigger (owner, { gameData }) {
        owner.money += 5;
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

    trigger (owner, { gameData }) {
        owner.money += 3;
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

    trigger (owner, { currentPlayer }) {
        const amount = owner.hasCard(CardName.ShoppingCenter) ? 3 : 2;
        const realAmount = Math.min(amount, currentPlayer.money);
        currentPlayer.money -= realAmount;
        owner.money += realAmount;
    }
};

export const mall: Card = {
    cardName: CardName.Mall,
    name: 'Obchodní dům',
    cost: 2,
    description: 'Za každý svůj objekt Obilí si vezměte 2 mince z banku',
    symbol: CardSymbol.Mall,
    color: CardColor.Green,
    triggerNumbers: [11, 12],

    trigger (owner, { gameData }) {
        const symbolCount = owner.symbolCount(CardSymbol.Wheat);
        owner.money += symbolCount * 2;
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

    trigger (owner, handler) {}
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

    trigger (owner, handler) {}
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

    trigger (owner, handler) {}
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

    trigger (owner, handler) {}
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
export const normalCards: Card[] =
    [wheatField, farm, bakery, coffeeShop, shop, forest, stadium, televisionStudio,
        officeBuilding, dairyShop, furnitureFactory, mine, applePark, restaurant, mall];
export const dominants: Card[] = [station, shoppingCenter, amusementPark, transmitter];
