import { Module } from "@nestjs/common";
import { RoomService } from "./room.service";
import { RoomGateway } from "./room.gateway";
import { DataModule } from "src/data/data.module";
import { RoomController } from "./room.controller";
import { AppGateway } from "src/app.gateway";
import { RoomUserService } from "./room-user.service";
import { DtoService } from "./dto/dto.service";

@Module({
   imports: [DataModule],
   providers: [RoomService, RoomGateway, AppGateway, RoomUserService, DtoService],
   controllers: [RoomController],
   exports: [RoomService, RoomUserService],
})
export class RoomModule {}
