import { Module } from "@nestjs/common";
import { RoomService } from "./room.service";
import { RoomGateway } from "./room.gateway";
import { DataModule } from "src/data/data.module";
import { RoomController } from "./room.controller";
import { AppGateway } from "src/app.gateway";

@Module({
   imports: [DataModule],
   providers: [RoomService, RoomGateway, AppGateway],
   controllers: [RoomController],
   exports: [RoomService],
})
export class RoomModule {}
