import { Card, CardColor, CardName, CardSymbol } from './card.interface';

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

export const sushiBar: Card = {
    cardName: CardName.SushiBar,
    name: 'Sushi Bar',
    cost: 2,
    description: 'Máte-li přístav, dostanete 3 mince od hráče na tahu.',
    symbol: CardSymbol.Coffee,
    color: CardColor.Red,
    triggerNumbers: [1],

    trigger (owner, { currentPlayer }) {
        if (!owner.hasCard(CardName.Port)) {
            return;
        }
        const amount = owner.hasCard(CardName.ShoppingCenter) ? 4 : 3;
        const realAmount = Math.min(amount, currentPlayer.money);
        currentPlayer.money -= realAmount;
        owner.money += realAmount;
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

export const convenienceStore: Card = {
    cardName: CardName.ConvenienceStore,
    name: 'Hokynářství',
    cost: 0,
    description: 'Máte-li postavenou nejvýše 1 dominantu (kromě radnice), vezměte si 2 mince z banku.',
    symbol: CardSymbol.Box,
    color: CardColor.Green,
    triggerNumbers: [2],

    trigger (owner, { gameData }) {
        if (owner.dominantCount() > 1) {
            return;
        }
        const amount = owner.hasCard(CardName.ShoppingCenter) ? 3 : 2;
        owner.money += amount;
        gameData.bank -= amount;
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

export const cornField: Card = {
    cardName: CardName.CornField,
    name: 'Kukuřičné pole',
    cost: 2,
    description: 'Máte-li postavenou nejvýše 1 dominantu (kromě radnice), vezměte si 1 mince z banku.',
    symbol: CardSymbol.Wheat,
    color: CardColor.Blue,
    triggerNumbers: [3, 4],

    trigger (owner, { gameData }) {
        if (owner.dominantCount() > 1) {
            return;
        }
        owner.money += 1;
        gameData.bank -= 1;
    }
};

export const flowerGarden: Card = {
    cardName: CardName.FlowerGarden,
    name: 'Květinová zahrada',
    cost: 2,
    description: 'Vezměte si 1 mince z banku.',
    symbol: CardSymbol.Wheat,
    color: CardColor.Blue,
    triggerNumbers: [4],

    trigger (owner, { gameData }) {
        owner.money += 1;
        gameData.bank -= 1;
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

export const luxuriousRestaurant: Card = {
    cardName: CardName.LuxuriousRestaurant,
    name: 'Luxusní restaurace',
    cost: 3,
    description: 'Má-li hráč na tahu postavené alespoň 2 dominanty (kromě radnice), dostanete od něj 5 mincí.',
    symbol: CardSymbol.Coffee,
    color: CardColor.Red,
    triggerNumbers: [5],

    trigger (owner, { currentPlayer }) {
        if (currentPlayer.dominantCount() < 2) {
            return;
        }
        const amount = owner.hasCard(CardName.ShoppingCenter) ? 6 : 5;
        const realAmount = Math.min(amount, currentPlayer.money);
        currentPlayer.money -= realAmount;
        owner.money += realAmount;
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

export const flowerShop: Card = {
    cardName: CardName.FlowerShop,
    name: 'Květinářství',
    cost: 2,
    description: 'Za každou svoji květinovou zahradu si vezměte 1 minci z banku.',
    symbol: CardSymbol.Box,
    color: CardColor.Green,
    triggerNumbers: [6],

    trigger (owner, { gameData }) {
        let amount = owner.cardCount(CardName.FlowerGarden);
        if (owner.hasCard(CardName.ShoppingCenter)) {
            amount += 1;
        }
        owner.money += amount;
        gameData.bank -= amount;
    }
};
// TODO: Záložna, Stavební Firma - nobody plays those
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

    trigger (owner, handler, targetPlayerId: number) {
        const targetPlayer = handler.getPlayer(targetPlayerId);
        const amount = Math.min(5, targetPlayer.money);
        targetPlayer.money -= amount;
        owner.money += amount;
    }
};

interface OfficeBuildingArgs {
    targetPlayerId: number;
    swapCardOwn: CardName;
    swapCardTarget: CardName;
}

export const officeBuilding: Card = {
    cardName: CardName.OfficeBuilding,
    name: 'Kancelářská budova',
    cost: 8,
    description: `Můžete vyměnit jednu svoji kartu objektu za soupeřovu (nelze měnit #SYMBOL_${CardSymbol.Tower})`,
    symbol: CardSymbol.Tower,
    color: CardColor.Purple,
    triggerNumbers: [6],

    trigger (owner, handler, args: OfficeBuildingArgs) {
        // assume we have the card and the target has the card too
        const targetPlayer = handler.getPlayer(args.targetPlayerId);
        owner.removeCard(args.swapCardOwn);
        targetPlayer.addCard(args.swapCardOwn);

        targetPlayer.removeCard(args.swapCardTarget);
        owner.addCard(args.swapCardTarget);
    }
};
//
export const publishingHouse: Card = {
    cardName: CardName.PublishingHouse,
    name: 'Nakladatelství',
    cost: 5,
    description: `Dostanete po 1 minci od každého soupeře za každý jeho objekt #SYMBOL_${CardSymbol.Coffee} a #SYMBOL_${CardSymbol.Box}.`,
    symbol: CardSymbol.Tower,
    color: CardColor.Purple,
    triggerNumbers: [7],

    trigger (owner, { otherPlayers }) {
        otherPlayers.forEach((player) => {
            const amount = player.symbolCount(CardSymbol.Coffee) + player.symbolCount(CardSymbol.Box);
            const realAmount = Math.min(amount, player.money);
            player.money -= realAmount;
            owner.money += realAmount;
        });
    }
};

export const vineyard: Card = {
    cardName: CardName.Vineyard,
    name: 'Vinohrad',
    cost: 3,
    description: 'Vezměte si 3 mincí z banku',
    symbol: CardSymbol.Wheat,
    color: CardColor.Blue,
    triggerNumbers: [7],

    trigger (owner, { gameData }) {
        owner.money += 3;
        gameData.bank -= 3;
    }
};

export const pizzeria: Card = {
    cardName: CardName.Pizzeria,
    name: 'Pizzerie',
    cost: 1,
    description: 'Dostanete 1 minci od hráče na tahu',
    symbol: CardSymbol.Coffee,
    color: CardColor.Red,
    triggerNumbers: [7],

    trigger (owner, { currentPlayer }) {
        const amount = owner.hasCard(CardName.ShoppingCenter) ? 2 : 1;
        const realAmount = Math.min(amount, currentPlayer.money);
        currentPlayer.money -= realAmount;
        owner.money += realAmount;
    }
};

export const dairyShop: Card = {
    cardName: CardName.DairyShop,
    name: 'Mlékárna',
    cost: 5,
    description: `Za každý svůj objekt #SYMBOL_${CardSymbol.Pig} si vezměte 3 mince z banku`,
    symbol: CardSymbol.Factory,
    color: CardColor.Green,
    triggerNumbers: [7],

    trigger (owner, { gameData }) {
        const symbolCount = owner.symbolCount(CardSymbol.Pig);
        owner.money += symbolCount * 3;
        gameData.bank -= symbolCount * 3;
    }
};

// TODO: Water Treatment Plant

export const burgerGrill: Card = {
    cardName: CardName.BurgerGrill,
    name: 'Burger grill',
    cost: 1,
    description: 'Dostanete 1 minci od hráče na tahu',
    symbol: CardSymbol.Coffee,
    color: CardColor.Red,
    triggerNumbers: [8],

    trigger (owner, { currentPlayer }) {
        const amount = owner.hasCard(CardName.ShoppingCenter) ? 2 : 1;
        const realAmount = Math.min(amount, currentPlayer.money);
        currentPlayer.money -= realAmount;
        owner.money += realAmount;
    }
};

export const furnitureFactory: Card = {
    cardName: CardName.FurnitureFactory,
    name: 'Továrna na nábytek',
    cost: 3,
    description: `Za každý svůj objekt #SYMBOL_${CardSymbol.Cog} si vezměte 3 mince z banku`,
    symbol: CardSymbol.Factory,
    color: CardColor.Green,
    triggerNumbers: [8],

    trigger (owner, { gameData }) {
        const symbolCount = owner.symbolCount(CardSymbol.Cog);
        owner.money += symbolCount * 3;
        gameData.bank -= symbolCount * 3;
    }
};

export const fishingBoat: Card = {
    cardName: CardName.FishingBoat,
    name: 'Rybářský člun',
    cost: 2,
    description: 'Máte-li přístav, vezměte si 3 mince z banku',
    symbol: CardSymbol.Cog,
    color: CardColor.Blue,
    triggerNumbers: [8],

    trigger (owner, { gameData }) {
        if (!owner.hasCard(CardName.Port)) {
            return;
        }
        owner.money += 3;
        gameData.bank -= 3;
    }
};

export const financialOffice: Card = {
    cardName: CardName.FinancialOffice,
    name: 'Finanční úřad',
    cost: 4,
    description: 'Dostanete polovinu mincí (zaokrouhleno dolů od každého soupeře, který má aktuálně 10 a více mincí.',
    symbol: CardSymbol.Tower,
    color: CardColor.Purple,
    triggerNumbers: [8, 9],

    trigger (owner, { otherPlayers }) {
        otherPlayers.forEach((player) => {
            if (player.money < 10) {
                return;
            }
            const amount = Math.floor(player.money / 2.0);
            player.money -= amount;
            owner.money += amount;
        });
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

// TODO: Winery

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

// TODO: IT Center

interface LogisticsCompanyArgs {
    targetPlayerId: number;
    card: CardName;
}

export const logisticsCompany: Card = {
    cardName: CardName.LogisticsCompany,
    name: 'Přepravní firma',
    cost: 2,
    description: `Odevzdejte libovolnému soupeři svůj libovolný objekt (ne však #SYMBOL_${CardSymbol.Tower}). Za to si vezměte 4 mince z banku.`,
    symbol: CardSymbol.Suitcase,
    color: CardColor.Green,
    triggerNumbers: [9, 10],

    trigger (owner, handler, args: LogisticsCompanyArgs) {
        const target = handler.getPlayer(args.targetPlayerId);
        owner.removeCard(args.card);
        target.addCard(args.card);
        owner.money += 4;
        handler.gameData.bank -= 4;
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

export const sodaCompany: Card = {
    cardName: CardName.SodaCompany,
    name: 'Sodovkárna',
    cost: 5,
    description: `Vezměte si po 1 minci z banku za každý objekt #SYMBOL_${CardSymbol.Coffee} každého hráče (i svůj).`,
    symbol: CardSymbol.Factory,
    color: CardColor.Green,
    triggerNumbers: [11],

    trigger (owner, handler) {
        const amount = handler.allPlayers
            .map(player => player.symbolCount(CardSymbol.Coffee))
            .reduce((acc, cur) => acc + cur, 0);
        owner.money += amount;
        handler.gameData.bank -= amount;
    }
};

export const park: Card = {
    cardName: CardName.Park,
    name: 'Park',
    cost: 3,
    description: 'Vezměte a nově rozdělte všechny mince všech hráčů mezi všechny hráče rovným dílem. Případné chybějící mince doplňte z banku.',
    symbol: CardSymbol.Tower,
    color: CardColor.Purple,
    triggerNumbers: [11, 12, 13],

    trigger (owner, handler) {
        const numPlayers = handler.allPlayers.length;
        const totalMoney = handler.allPlayers
            .map(player => player.money)
            .reduce((acc, cur) => acc + cur, 0);
        const perPlayer = Math.ceil(totalMoney / numPlayers);
        const missing = numPlayers * perPlayer - totalMoney;

        handler.gameData.bank -= missing;
        handler.allPlayers.forEach((player) => {
            player.money = perPlayer;
        });
    }
};

export const mall: Card = {
    cardName: CardName.Mall,
    name: 'Obchodní dům',
    cost: 2,
    description: `Za každý svůj objekt #SYMBOL_${CardSymbol.Wheat} si vezměte 2 mince z banku`,
    symbol: CardSymbol.Mall,
    color: CardColor.Green,
    triggerNumbers: [11, 12],

    trigger (owner, { gameData }) {
        const symbolCount = owner.symbolCount(CardSymbol.Wheat);
        owner.money += symbolCount * 2;
        gameData.bank -= symbolCount * 2;
    }
};

export const foodWholesale: Card = {
    cardName: CardName.FoodWholesale,
    name: 'Velkoobchod s potravinami',
    cost: 2,
    description: `Za každý svůj objekt #SYMBOL_${CardSymbol.Coffee} si vezměte 2 mince z banku.`,
    symbol: CardSymbol.Factory,
    color: CardColor.Green,
    triggerNumbers: [12, 13],

    trigger (owner, { gameData }) {
        const amount = owner.symbolCount(CardSymbol.Coffee) * 2;
        owner.money += amount;
        gameData.bank -= amount;
    }
};

export const nightClub: Card = {
    cardName: CardName.NightClub,
    name: 'Noční klub',
    cost: 4,
    description: 'Má-li hráč na tahu postavené alespoň 3 dominanty (kromě radnice), dostanete všechny jeho mince.',
    symbol: CardSymbol.Coffee,
    color: CardColor.Red,
    triggerNumbers: [12, 13, 14],

    trigger (owner, { currentPlayer }) {
        if (currentPlayer.dominantCount() < 3) {
            return;
        }
        const amount = currentPlayer.money;
        currentPlayer.money -= amount;
        owner.money += amount;
    }
};

// TODO: Fishing Ship

// Winning cards
export const townHall: Card = {
    cardName: CardName.TownHall,
    name: 'Radnice',
    cost: 0,
    description: 'Nemáte-li před krokem Stavba ve svém tahu žádné peníze, vezměte si 1 minci z banku.',

    // irrelevant but necessary for typecheck
    symbol: CardSymbol.Tower,
    color: CardColor.Dominant,
    triggerNumbers: [],

    trigger (owner, handler) {}
};

export const port: Card = {
    cardName: CardName.Port,
    name: 'Přístav',
    cost: 2,
    description: 'Padne-li vám na kostkách 10 a více, smíte k výsledku hodu přičíst 2.',

    // irrelevant but necessary for typecheck
    symbol: CardSymbol.Tower,
    color: CardColor.Dominant,
    triggerNumbers: [],

    trigger (owner, handler) {}
};

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
    description: `Dostáváte-li příjmy za objekty #SYMBOL_${CardSymbol.Coffee} nebo #SYMBOL_${CardSymbol.Box}, dostanete za každý z nich o 1 minci více.`,

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

export const airport: Card = {
    cardName: CardName.Airport,
    name: 'Letiště',
    cost: 30,
    description: 'Nepostavíte-li ve svém tahu žádný objekt ani dominantu, vezměte si 10 mincí z banku.',

    // irrelevant but necessary for typecheck
    symbol: CardSymbol.Tower,
    color: CardColor.Dominant,
    triggerNumbers: [],

    trigger (owner, handler) {}
};

export const cardMap: { [index in CardName]: Card } = {
    [CardName.WheatField]: wheatField,
    [CardName.SushiBar]: sushiBar,
    [CardName.Farm]: farm,
    [CardName.ConvenienceStore]: convenienceStore,
    [CardName.Bakery]: bakery,
    [CardName.CoffeeShop]: coffeeShop,
    [CardName.CornField]: cornField,
    [CardName.FlowerGarden]: flowerGarden,
    [CardName.Shop]: shop,
    [CardName.LuxuriousRestaurant]: luxuriousRestaurant,
    [CardName.Forest]: forest,
    [CardName.FlowerShop]: flowerShop,
    [CardName.Stadium]: stadium,
    [CardName.TelevisionStudio]: televisionStudio,
    [CardName.OfficeBuilding]: officeBuilding,
    [CardName.PublishingHouse]: publishingHouse,
    [CardName.Vineyard]: vineyard,
    [CardName.Pizzeria]: pizzeria,
    [CardName.DairyShop]: dairyShop,
    [CardName.BurgerGrill]: burgerGrill,
    [CardName.FurnitureFactory]: furnitureFactory,
    [CardName.FishingBoat]: fishingBoat,
    [CardName.FinancialOffice]: financialOffice,
    [CardName.Mine]: mine,
    [CardName.ApplePark]: applePark,
    [CardName.LogisticsCompany]: logisticsCompany,
    [CardName.Restaurant]: restaurant,
    [CardName.SodaCompany]: sodaCompany,
    [CardName.Park]: park,
    [CardName.Mall]: mall,
    [CardName.FoodWholesale]: foodWholesale,
    [CardName.NightClub]: nightClub,

    [CardName.TownHall]: townHall,
    [CardName.Port]: port,
    [CardName.Station]: station,
    [CardName.ShoppingCenter]: shoppingCenter,
    [CardName.AmusementPark]: amusementPark,
    [CardName.Transmitter]: transmitter,
    [CardName.Airport]: airport
};

// TODO: new cards are missing here, but so far it hasn't been used anyway
export const normalCards: Card[] =
    [wheatField, farm, bakery, coffeeShop, shop, forest, stadium, televisionStudio,
        officeBuilding, dairyShop, furnitureFactory, mine, applePark, restaurant, mall];
export const dominants: Card[] = [townHall, port, station, shoppingCenter, amusementPark, transmitter, airport];
