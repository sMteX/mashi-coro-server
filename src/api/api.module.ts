import { Module } from '@nestjs/common';
import { ApiController } from '@app/api/api.controller';
import { WsModule } from '@app/ws/ws.module';

@Module({
    imports: [WsModule],
    controllers: [ApiController]
})
export class ApiModule {}
