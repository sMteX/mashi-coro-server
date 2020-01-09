import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@WebSocketGateway()
export class WsGateway {
    @WebSocketServer()
    server: Server;

    @SubscribeMessage('events')
    findAll(@MessageBody() data: any): Observable<WsResponse<number>> {
        console.log(data);
        return from([1, 2, 3]).pipe(map(item => ({ event: 'events', data: item })));
    }

    @SubscribeMessage('identity')
    identity(@MessageBody() data: number): number {
        console.log(data);
        return data;
    }

    @SubscribeMessage('next')
    next(@MessageBody() data: number): number {
        console.log(data);
        return data + 1;
    }
}
