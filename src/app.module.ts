import { Module, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';
import { WsModule } from '@app/ws/ws.module';
import { ApiModule } from '@app/api/api.module';

@Module({
    imports: [
        TypeOrmModule.forRoot(),
        WsModule,
        ApiModule,
        AppModule
    ],
    providers: [
        {
            provide: APP_PIPE,
            useClass: ValidationPipe
        }
    ]
})
export class AppModule {}
