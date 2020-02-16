import * as config from 'config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const port: number = config.get('server.port'); // should map process.env.PORT with highest precedence

    const app = await NestFactory.create(AppModule, { cors: true });
    if (process.env.NODE_ENV === 'production') {
        await app.listen(port);
    } else {
        const host: string = config.get('server.host');
        await app.listen(port, host);
    }
}

bootstrap();
