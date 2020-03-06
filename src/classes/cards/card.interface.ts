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
    Boat, // Rybarsky clun, Rybarska lod..
    Mall, // Obchodni dum
    Suitcase, // Zalozna, Stavebni firma...
    Other // just in case?
}

export enum CardName {
    WheatField,
    SushiBar,
    Farm,
    ConvenienceStore,
    Bakery,
    CoffeeShop,
    CornField,
    FlowerGarden,
    Shop,
    LuxuriousRestaurant,
    Forest,
    FlowerShop,
    Stadium,
    TelevisionStudio,
    OfficeBuilding,
    PublishingHouse,
    Vineyard,
    Pizzeria,
    DairyShop,
    WaterTreatmentPlant,
    BurgerGrill,
    FurnitureFactory,
    FishingBoat,
    FinancialOffice,
    Mine,
    Winery,
    LogisticsCompany,
    ApplePark,
    ItCenter,
    Restaurant,
    SodaCompany,
    Park,
    Mall,
    FoodWholesale,
    NightClub,
    FishingShip,

    TownHall,
    Port,
    Station,
    ShoppingCenter,
    AmusementPark,
    Transmitter,
    Airport
}

export const redCards: CardName[] =
    [CardName.SushiBar, CardName.CoffeeShop, CardName.LuxuriousRestaurant, CardName.Pizzeria, CardName.BurgerGrill, CardName.Restaurant, CardName.NightClub];
export const blueCards: CardName[] =
    [CardName.WheatField, CardName.Farm, CardName.CornField, CardName.FlowerGarden, CardName.Forest, CardName.Vineyard, CardName.FishingBoat, CardName.Mine, CardName.ApplePark, CardName.FishingShip];
export const greenCards: CardName[] =
    [CardName.ConvenienceStore, CardName.Bakery, CardName.Shop, CardName.FlowerShop, CardName.DairyShop, CardName.FurnitureFactory, CardName.Winery, CardName.LogisticsCompany, CardName.SodaCompany, CardName.Mall, CardName.FoodWholesale];
export const passivePurpleCards: CardName[] =
    [CardName.Stadium, CardName.FinancialOffice, CardName.Park, CardName.PublishingHouse, CardName.ItCenter];
export const activePurpleCards: CardName[] =
    [CardName.TelevisionStudio, CardName.OfficeBuilding, CardName.WaterTreatmentPlant];

export interface Card {
    cardName: CardName;
    name: string;
    triggerNumbers: number[];
    symbol: CardSymbol;
    color: CardColor;
    cost: number;
    description: string;
    // reactive methods?
    trigger: (owner: PlayerGameData, game: GameHandler, args?: any) => void;
}
