import { Controller, Post } from '@nestjs/common';
import { WsGateway } from '@app/ws/ws.gateway';

@Controller('api')
export class ApiController {
    constructor(private readonly wsGateway: WsGateway) {}

    @Post()
    poke(): void {
        console.log('in poke');
        this.wsGateway.server.emit('msgToClient', { data: 'Hello World' });
    }
}
