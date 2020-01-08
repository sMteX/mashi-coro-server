import { Module, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';

@Module({
    imports: [
        TypeOrmModule.forRoot()
    ],
    providers: [
        {
            provide: APP_PIPE,
            useClass: ValidationPipe
        }
    ]
})
export class AppModule {}
