import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AppGateway } from "./app.gateway";
import { DataModule } from "./data/data.module";
import { RoomModule } from "./room/room.module";
import { GameModule } from "./game/game.module";
import { ConfigModule } from "@nestjs/config";

@Module({
   imports: [
      ConfigModule.forRoot({
         isGlobal: true, // 환경변수 전역으로 사용
      }),
      DataModule,
      RoomModule,
      GameModule,
   ],
   controllers: [AppController],
   providers: [AppService, AppGateway],
})
export class AppModule {}
