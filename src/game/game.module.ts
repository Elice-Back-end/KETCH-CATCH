import { Module } from "@nestjs/common";
import { GameService } from "./game.service";
import { GameGateway, ChatGateway } from "./game.gateway";
import { DataModule } from "src/data/data.module";
import { RoomModule } from "src/room/room.module";

@Module({
   imports: [DataModule, RoomModule],
   providers: [GameService, GameGateway, ChatGateway],
})
export class GameModule {}
