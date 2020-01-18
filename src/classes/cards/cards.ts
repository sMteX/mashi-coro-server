import { Card, CardSymbol } from './card.interface';
import { GameHandler } from '../gameHandler';

export class WheatField implements Card {
    name = 'Pšeničné pole';
    cost = 1;
    description = 'Vezměte si 1 minci z banku';
    symbol = CardSymbol.Wheat;
    triggerNumbers = [1];
    canBeTriggeredByOthers = true;
    canBeTriggeredBySelf = true;

    trigger ({ currentPlayer, gameData }: GameHandler) {
        currentPlayer.money += 1;
        gameData.bank -= 1;
    }
}

export class Farm implements Card {
    name = 'Statek';
    cost = 1;
    description = 'Vezměte si 1 minci z banku';
    symbol = CardSymbol.Pig;
    triggerNumbers = [2];
    canBeTriggeredByOthers = true;
    canBeTriggeredBySelf = true;

    trigger ({ currentPlayer, gameData }: GameHandler) {
        currentPlayer.money += 1;
        gameData.bank -= 1;
    }
}

export class Bakery implements Card {
    name = 'Pekárna';
    cost = 1;
    description = 'Vezměte si 1 minci z banku';
    symbol = CardSymbol.Toast;
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
    name = 'Kavárna';
    cost = 2;
    description = 'Dostanete 1 minci od hráče na tahu';
    symbol = CardSymbol.Coffee;
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
    name = 'Samoobsluha';
    cost = 2;
    description = 'Vezměte si 3 mince z banku';
    symbol = CardSymbol.Toast;
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
    name = 'Les';
    cost = 3;
    description = 'Vezměte si 1 minci z banku';
    symbol = CardSymbol.Cog;
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
    name = 'Stadión';
    cost = 6;
    description = 'Dostanete 2 mince od každého soupeře';
    symbol = CardSymbol.Tower;
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
    name = 'Stadión';
    cost = 7;
    description = 'Dostanete 5 mincí od zvoleného soupeře';
    symbol = CardSymbol.Tower;
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
    name = 'Kancelářská budova';
    cost = 8;
    description = 'Můžete vyměnit jednu svoji kartu objektu za soupeřovu (nelze měnit Věže)';
    symbol = CardSymbol.Tower;
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
    name = 'Mlékárna';
    cost = 5;
    description = 'Za každý svůj objekt Prase si vezměte 3 mince z banku';
    symbol = CardSymbol.Factory;
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
    name = 'Továrna na nábytek';
    cost = 3;
    description = 'Za každý svůj objekt Kolečko si vezměte 3 mince z banku';
    symbol = CardSymbol.Factory;
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
    name = 'Důl';
    cost = 6;
    description = 'Vezměte si 5 mincí z banku';
    symbol = CardSymbol.Cog;
    triggerNumbers = [9];
    canBeTriggeredByOthers = true;
    canBeTriggeredBySelf = true;

    trigger ({ currentPlayer, gameData }: GameHandler) {
        currentPlayer.money += 5;
        gameData.bank -= 5;
    }
}

export class ApplePark implements Card {
    name = 'Jabloňový sad';
    cost = 3;
    description = 'Vezměte si 3 mince z banku';
    symbol = CardSymbol.Wheat;
    triggerNumbers = [10];
    canBeTriggeredByOthers = true;
    canBeTriggeredBySelf = true;

    trigger ({ currentPlayer, gameData }: GameHandler) {
        currentPlayer.money += 3;
        gameData.bank -= 3;
    }
}

export class Restaurant implements Card {
    name = 'Restaurace';
    cost = 3;
    description = 'Dostanete 2 minci od hráče na tahu';
    symbol = CardSymbol.Coffee;
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
    name = 'Obchodní dům';
    cost = 2;
    description = 'Za každý svůj objekt Obilí si vezměte 2 mince z banku';
    symbol = CardSymbol.Other;
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
    name = 'Nádraží';
    cost = 4;
    description = 'Můžete házet jednou nebo dvěma kostkami.';

    // irrelevant but necessary for typecheck
    symbol = CardSymbol.Tower;
    triggerNumbers = [];
    canBeTriggeredByOthers = false;
    canBeTriggeredBySelf = false;

    trigger (handler: GameHandler) {}
}

export class ShoppingCenter implements Card {
    name = 'Nákupní centrum';
    cost = 10;
    description = 'Dostáváte-li příjmy za objekty Kafe nebo Toast, dostanete za každý z nich o 1 minci více.';

    // irrelevant but necessary for typecheck
    symbol = CardSymbol.Tower;
    triggerNumbers = [];
    canBeTriggeredByOthers = false;
    canBeTriggeredBySelf = false;

    trigger (handler: GameHandler) {}
}

export class AmusementPark implements Card {
    name = 'Zábavní park';
    cost = 16;
    description = 'Pokud vám při hodu dvěma kostkami padnou stejná čísla, máte tah navíc.';

    // irrelevant but necessary for typecheck
    symbol = CardSymbol.Tower;
    triggerNumbers = [];
    canBeTriggeredByOthers = false;
    canBeTriggeredBySelf = false;

    trigger (handler: GameHandler) {}
}

export class Transmitter implements Card {
    name = 'Vysílač';
    cost = 22;
    description = 'Jednou v každém tahu smíte znovu hodit kostkami.';

    // irrelevant but necessary for typecheck
    symbol = CardSymbol.Tower;
    triggerNumbers = [];
    canBeTriggeredByOthers = false;
    canBeTriggeredBySelf = false;

    trigger (handler: GameHandler) {}
}
