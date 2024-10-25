import { Module } from "@nestjs/common";
import { UserService } from "./user/user.service";
import { AppGateway } from "src/app.gateway";
import { RoomSettingService } from "./room/room-setting.service";

@Module({ providers: [UserService, AppGateway, RoomSettingService], exports: [UserService, RoomSettingService] })
export class DataModule {}
