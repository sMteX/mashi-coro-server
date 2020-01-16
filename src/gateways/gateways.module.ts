import { Module } from '@nestjs/common';
import { WsGateway } from './ws.gateway';
import { LobbyGateway } from '@app/gateways/lobby.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from '@app/database/entities/game.entity';
import { GameGateway } from '@app/gateways/game.gateway';

@Module({
    imports: [
        TypeOrmModule.forFeature([Game])
    ],
    providers: [WsGateway, LobbyGateway, GameGateway],
    exports: [WsGateway, LobbyGateway, GameGateway]
})
export class GatewaysModule {}
