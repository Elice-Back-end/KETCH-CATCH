import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AppGateway } from "./app.gateway";
import { DataModule } from "./data/data.module";
import { RoomModule } from "./room/room.module";
import { GameModule } from "./game/game.module";
import { ConfigModule } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

@Module({
   imports: [
      ConfigModule.forRoot({
         envFilePath: ".env",
         isGlobal: true, // 환경변수 전역으로 사용
      }),
      ServeStaticModule.forRoot({
         rootPath: join(__dirname, "..", "public"), // 정적 파일이 위치한 폴더 경로
      }),
      DataModule,
      RoomModule,
      GameModule,
   ],
   controllers: [AppController],
   providers: [AppService, AppGateway],
})
export class AppModule {}
