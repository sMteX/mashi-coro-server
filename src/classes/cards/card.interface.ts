import { GameHandler } from '@app/classes/gameHandler';

export enum CardSymbol {
    Wheat, // Psenicne pole, Jablonovy sad
    Toast, // Pekarna, Samoobsluha
    Pig, // Statek
    Coffee, // Kavarna, Restaurace
    Cog, // Les, Dul
    Tower, // Stadion, Televizni studio, Kancelarska budova
    Factory, // Mlekarna, Tovarna na nabytek
    Other // Obchodni dum...
}

export interface Card {
    name: string;
    triggerNumbers: number[];
    symbol: CardSymbol;
    cost: number;
    description: string;
    canBeTriggeredByOthers: boolean;
    canBeTriggeredBySelf: boolean;
    // reactive methods?
    trigger: (handler: GameHandler) => void;
}
