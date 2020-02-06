import { GameHandler } from '@app/classes/gameHandler';
import { PlayerGameData } from '@app/classes/playerGameData';

export enum CardColor {
    Green,
    Blue,
    Red,
    Purple,
    Dominant
}

export enum CardSymbol {
    Wheat, // Psenicne pole, Jablonovy sad
    Box, // Pekarna, Samoobsluha
    Pig, // Statek
    Coffee, // Kavarna, Restaurace
    Cog, // Les, Dul
    Tower, // Stadion, Televizni studio, Kancelarska budova
    Factory, // Mlekarna, Tovarna na nabytek
    Other // Obchodni dum...
}

export enum CardName {
    WheatField,
    Farm,
    Bakery,
    CoffeeShop,
    Shop,
    Forest,
    Stadium,
    TelevisionStudio,
    OfficeBuilding,
    DairyShop,
    FurnitureFactory,
    Mine,
    ApplePark,
    Restaurant,
    Mall,

    Station,
    ShoppingCenter,
    AmusementPark,
    Transmitter
}

export interface Card {
    cardName: CardName;
    name: string;
    triggerNumbers: number[];
    symbol: CardSymbol;
    color: CardColor;
    cost: number;
    description: string;
    // reactive methods?
    trigger: (owner: PlayerGameData, game: GameHandler) => void;
}
