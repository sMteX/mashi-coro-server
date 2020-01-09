import { Module } from '@nestjs/common';
import { WsGateway } from '@app/ws/ws.gateway';

@Module({
    providers: [WsGateway],
    exports: [WsGateway]
})
export class WsModule {}
