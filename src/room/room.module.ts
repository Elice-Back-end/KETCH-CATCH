import { Module } from "@nestjs/common";
import { RoomService } from "./room.service";
import { RoomGateway } from "./room.gateway";
import { DataModule } from "src/data/data.module";

@Module({
   imports: [DataModule],
   providers: [RoomService, RoomGateway],
   exports: [RoomService],
})
export class RoomModule {}
