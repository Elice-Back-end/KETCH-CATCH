import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway()
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
   @WebSocketServer() server: Server;

   handleConnection(socket: Socket) {
      try {
         console.log("socket에 연결되었습니다.😀");
      } catch (e) {
         this.handleError(e);
      }
   }

   handleDisconnect() {
      console.log("socket과의 연결이 끊어졌습니다.🥲");
   }

   handleError(err: any) {
      console.error(err);
      this.server.emit("error", err);
   }
}
