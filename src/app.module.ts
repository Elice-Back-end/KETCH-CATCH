import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { RoomGateway } from "./room/room.gateway";
import { UserService } from "./data/user/user.service";
import { AppGateway } from "./app.gateway";

@Module({
   imports: [],
   controllers: [AppController],
   providers: [AppService, RoomGateway, UserService, AppGateway],
})
export class AppModule {}
