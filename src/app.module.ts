import { Module, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';
import { ApiController } from '@app/api.controller';
import { GatewaysModule } from '@app/gateways/gateways.module';
import { Game } from '@app/database/entities/game.entity';

@Module({
    imports: [
        TypeOrmModule.forRoot(),
        TypeOrmModule.forFeature([Game]),
        GatewaysModule
    ],
    controllers: [ApiController],
    providers: [
        {
            provide: APP_PIPE,
            useClass: ValidationPipe
        }
    ]
})
export class AppModule {}
