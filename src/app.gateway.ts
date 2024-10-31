import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
@WebSocketGateway({ namespace: "ketch-catch" })
export class AppGateway {
   @WebSocketServer() server: Server;

   handleError(err: any) {
      console.error(err);
      this.server.emit("error", err);
   }
}
