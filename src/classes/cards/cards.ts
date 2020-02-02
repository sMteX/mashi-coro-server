import { Card, CardColor, CardName, CardSymbol } from './card.interface';
import { GameHandler } from '../gameHandler';

export class WheatField implements Card {
    cardName = CardName.WheatField;
    name = 'Pšeničné pole';
    cost = 1;
    description = 'Vezměte si 1 minci z banku';
    symbol = CardSymbol.Wheat;
    color = CardColor.Blue;
    triggerNumbers = [1];
    canBeTriggeredByOthers = true;
    canBeTriggeredBySelf = true;

    trigger ({ currentPlayer, gameData }: GameHandler) {
        currentPlayer.money += 1;
        gameData.bank -= 1;
    }
}

export class Farm implements Card {
    cardName = CardName.Farm;
    name = 'Statek';
    cost = 1;
    description = 'Vezměte si 1 minci z banku';
    symbol = CardSymbol.Pig;
    color = CardColor.Blue;
    triggerNumbers = [2];
    canBeTriggeredByOthers = true;
    canBeTriggeredBySelf = true;

    trigger ({ currentPlayer, gameData }: GameHandler) {
        currentPlayer.money += 1;
        gameData.bank -= 1;
    }
}

export class Bakery implements Card {
    cardName = CardName.Bakery;
    name = 'Pekárna';
    cost = 1;
    description = 'Vezměte si 1 minci z banku';
    symbol = CardSymbol.Toast;
    color = CardColor.Green;
    triggerNumbers = [2, 3];
    canBeTriggeredByOthers = false;
    canBeTriggeredBySelf = true;

    trigger ({ currentPlayer, gameData }: GameHandler) {
        const amount = currentPlayer.hasCard(ShoppingCenter) ? 2 : 1;
        currentPlayer.money += amount;
        gameData.bank -= amount;
    }
}

export class CoffeeShop implements Card {
    cardName = CardName.CoffeeShop;
    name = 'Kavárna';
    cost = 2;
    description = 'Dostanete 1 minci od hráče na tahu';
    symbol = CardSymbol.Coffee;
    color = CardColor.Red;
    triggerNumbers = [3];
    canBeTriggeredByOthers = true;
    canBeTriggeredBySelf = false;

    trigger ({ currentPlayer, otherPlayers }: GameHandler) {
        otherPlayers.forEach((player) => {
            for (let i = 0; i < player.cardCount(CoffeeShop); i += 1) {
                // TODO: current player gives away money CLOCKWISE to other players, if he can
                const amount = player.hasCard(ShoppingCenter) ? 2 : 1;
                currentPlayer.money -= amount;
                player.money += amount;
            }
        });
    }
}

export class Shop implements Card {
    cardName = CardName.Shop;
    name = 'Samoobsluha';
    cost = 2;
    description = 'Vezměte si 3 mince z banku';
    symbol = CardSymbol.Toast;
    color = CardColor.Green;
    triggerNumbers = [4];
    canBeTriggeredByOthers = false;
    canBeTriggeredBySelf = true;

    trigger ({ currentPlayer, gameData }: GameHandler) {
        const amount = currentPlayer.hasCard(ShoppingCenter) ? 4 : 3;
        currentPlayer.money += amount;
        gameData.bank -= amount;
    }
}

export class Forest implements Card {
    cardName = CardName.Forest;
    name = 'Les';
    cost = 3;
    description = 'Vezměte si 1 minci z banku';
    symbol = CardSymbol.Cog;
    color = CardColor.Blue;
    triggerNumbers = [5];
    canBeTriggeredByOthers = true;
    canBeTriggeredBySelf = true;

    trigger ({ currentPlayer, gameData }: GameHandler) {
        currentPlayer.money += 1;
        gameData.bank -= 1;
    }
}

// purple cards
export class Stadium implements Card {
    cardName = CardName.Stadium;
    name = 'Stadión';
    cost = 6;
    description = 'Dostanete 2 mince od každého soupeře';
    symbol = CardSymbol.Tower;
    color = CardColor.Purple;
    triggerNumbers = [6];
    canBeTriggeredByOthers = false;
    canBeTriggeredBySelf = true;

    trigger ({ currentPlayer, otherPlayers }: GameHandler) {
        otherPlayers.forEach((player) => {
            // TODO: don't go to negative money
            player.money -= 2;
            currentPlayer.money += 2;
        });
    }
}

export class TelevisionStudio implements Card {
    cardName = CardName.TelevisionStudio;
    name = 'Televizní studio';
    cost = 7;
    description = 'Dostanete 5 mincí od zvoleného soupeře';
    symbol = CardSymbol.Tower;
    color = CardColor.Purple;
    triggerNumbers = [6];
    canBeTriggeredByOthers = false;
    canBeTriggeredBySelf = true;

    trigger ({ currentPlayer, targetPlayer }: GameHandler) {
        // TODO: don't go to negative money
        targetPlayer.money -= 5;
        currentPlayer.money += 5;
    }
}

export class OfficeBuilding implements Card {
    cardName = CardName.OfficeBuilding;
    name = 'Kancelářská budova';
    cost = 8;
    description = 'Můžete vyměnit jednu svoji kartu objektu za soupeřovu (nelze měnit Věže)';
    symbol = CardSymbol.Tower;
    color = CardColor.Purple;
    triggerNumbers = [6];
    canBeTriggeredByOthers = false;
    canBeTriggeredBySelf = true;

    trigger ({ currentPlayer, targetPlayer, swapCardOwn, swapCardTarget }: GameHandler) {
        // assume we have the card and the target has the card too
        currentPlayer.removeCard(swapCardOwn);
        targetPlayer.addCard(swapCardOwn);

        targetPlayer.removeCard(swapCardTarget);
        currentPlayer.addCard(swapCardTarget);
    }
}
//
export class DairyShop implements Card {
    cardName = CardName.DairyShop;
    name = 'Mlékárna';
    cost = 5;
    description = 'Za každý svůj objekt Prase si vezměte 3 mince z banku';
    symbol = CardSymbol.Factory;
    color = CardColor.Green;
    triggerNumbers = [7];
    canBeTriggeredByOthers = false;
    canBeTriggeredBySelf = true;

    trigger ({ currentPlayer, gameData }: GameHandler) {
        const symbolCount = currentPlayer.symbolCount(CardSymbol.Pig);
        currentPlayer.money += symbolCount * 3;
        gameData.bank -= symbolCount * 3;
    }
}

export class FurnitureFactory implements Card {
    cardName = CardName.FurnitureFactory;
    name = 'Továrna na nábytek';
    cost = 3;
    description = 'Za každý svůj objekt Kolečko si vezměte 3 mince z banku';
    symbol = CardSymbol.Factory;
    color = CardColor.Green;
    triggerNumbers = [8];
    canBeTriggeredByOthers = false;
    canBeTriggeredBySelf = true;

    trigger ({ currentPlayer, gameData }: GameHandler) {
        const symbolCount = currentPlayer.symbolCount(CardSymbol.Cog);
        currentPlayer.money += symbolCount * 3;
        gameData.bank -= symbolCount * 3;
    }
}

export class Mine implements Card {
    cardName = CardName.Mine;
    name = 'Důl';
    cost = 6;
    description = 'Vezměte si 5 mincí z banku';
    symbol = CardSymbol.Cog;
    color = CardColor.Blue;
    triggerNumbers = [9];
    canBeTriggeredByOthers = true;
    canBeTriggeredBySelf = true;

    trigger ({ currentPlayer, gameData }: GameHandler) {
        currentPlayer.money += 5;
        gameData.bank -= 5;
    }
}

export class ApplePark implements Card {
    cardName = CardName.ApplePark;
    name = 'Jabloňový sad';
    cost = 3;
    description = 'Vezměte si 3 mince z banku';
    symbol = CardSymbol.Wheat;
    color = CardColor.Blue;
    triggerNumbers = [10];
    canBeTriggeredByOthers = true;
    canBeTriggeredBySelf = true;

    trigger ({ currentPlayer, gameData }: GameHandler) {
        currentPlayer.money += 3;
        gameData.bank -= 3;
    }
}

export class Restaurant implements Card {
    cardName = CardName.Restaurant;
    name = 'Restaurace';
    cost = 3;
    description = 'Dostanete 2 minci od hráče na tahu';
    symbol = CardSymbol.Coffee;
    color = CardColor.Red;
    triggerNumbers = [9, 10];
    canBeTriggeredByOthers = true;
    canBeTriggeredBySelf = false;

    trigger ({ currentPlayer, otherPlayers }: GameHandler) {
        otherPlayers.forEach((player) => {
            for (let i = 0; i < player.cardCount(Restaurant); i += 1) {
                // TODO: current player gives away money CLOCKWISE to other players, if he can
                const amount = player.hasCard(ShoppingCenter) ? 3 : 2;
                currentPlayer.money -= amount;
                player.money += amount;
            }
        });
    }
}

export class Mall implements Card {
    cardName = CardName.Mall;
    name = 'Obchodní dům';
    cost = 2;
    description = 'Za každý svůj objekt Obilí si vezměte 2 mince z banku';
    symbol = CardSymbol.Other;
    color = CardColor.Green;
    triggerNumbers = [11, 12];
    canBeTriggeredByOthers = false;
    canBeTriggeredBySelf = true;

    trigger ({ currentPlayer, gameData }: GameHandler) {
        const symbolCount = currentPlayer.symbolCount(CardSymbol.Wheat);
        currentPlayer.money += symbolCount * 2;
        gameData.bank -= symbolCount * 2;
    }
}

// Winning cards
export class Station implements Card {
    cardName = CardName.Station;
    name = 'Nádraží';
    cost = 4;
    description = 'Můžete házet jednou nebo dvěma kostkami.';

    // irrelevant but necessary for typecheck
    symbol = CardSymbol.Tower;
    color = CardColor.Dominant;
    triggerNumbers = [];
    canBeTriggeredByOthers = false;
    canBeTriggeredBySelf = false;

    trigger (handler: GameHandler) {}
}

export class ShoppingCenter implements Card {
    cardName = CardName.ShoppingCenter;
    name = 'Nákupní centrum';
    cost = 10;
    description = 'Dostáváte-li příjmy za objekty Kafe nebo Toast, dostanete za každý z nich o 1 minci více.';

    // irrelevant but necessary for typecheck
    symbol = CardSymbol.Tower;
    color = CardColor.Dominant;
    triggerNumbers = [];
    canBeTriggeredByOthers = false;
    canBeTriggeredBySelf = false;

    trigger (handler: GameHandler) {}
}

export class AmusementPark implements Card {
    cardName = CardName.AmusementPark;
    name = 'Zábavní park';
    cost = 16;
    description = 'Pokud vám při hodu dvěma kostkami padnou stejná čísla, máte tah navíc.';

    // irrelevant but necessary for typecheck
    symbol = CardSymbol.Tower;
    color = CardColor.Dominant;
    triggerNumbers = [];
    canBeTriggeredByOthers = false;
    canBeTriggeredBySelf = false;

    trigger (handler: GameHandler) {}
}

export class Transmitter implements Card {
    cardName = CardName.Transmitter;
    name = 'Vysílač';
    cost = 22;
    description = 'Jednou v každém tahu smíte znovu hodit kostkami.';

    // irrelevant but necessary for typecheck
    symbol = CardSymbol.Tower;
    color = CardColor.Dominant;
    triggerNumbers = [];
    canBeTriggeredByOthers = false;
    canBeTriggeredBySelf = false;

    trigger (handler: GameHandler) {}
}
