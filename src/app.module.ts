import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AppGateway } from "./app.gateway";
import { DataModule } from "./data/data.module";
import { RoomController } from "./room/room.controller";
import { RoomModule } from "./room/room.module";
import { GameModule } from "./game/game.module";

@Module({
   imports: [DataModule, RoomModule, GameModule],
   controllers: [AppController, RoomController],
   providers: [AppService, AppGateway],
})
export class AppModule {}
