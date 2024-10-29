import {
   OnGatewayConnection,
   OnGatewayDisconnect,
   SubscribeMessage,
   WebSocketGateway,
   MessageBody,
   WebSocketServer,
} from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { GameService } from "./game.service";
import { Game_user } from "./game.interface";
import { RoomSettingService } from "src/data/room/room-setting.service";
import { Room } from "src/data/room/room.interface";
import { UserService } from "src/data/user/user.service";
import { User } from "src/data/user/user.interface";

//채팅담당 게이트웨이
@WebSocketGateway({
   //네임스페이스 chat 설정
   namespace: "katch-catch",
   //모든 접근자 초기화
   cors: {
      origin: "*",
   },
})
export class ChatGateway {
   constructor(
      private userService: UserService,
      private roomSettingService: RoomSettingService,
      private gameService: GameService,
   ) {}

   // 서버를 선언해 브로드캐스트 환경
   @WebSocketServer()
   server: Server;

   @SubscribeMessage("message")
   handleMessage(socket: Socket, @MessageBody() message: { sender: string; content: string }) {
      // 메세지 확인용 콘솔 개발완료시 삭제
      console.log(message);

      // 유저와 방의 정보를 가져옴
      const user: User = this.userService.findOneUser(socket.id);
      const room: Room = this.roomSettingService.findOneRoom(user.roomId);

      // 게임이 시작하지 않았다면 채팅을 그냥 보내줌
      if (room.isStart === false) {
         this.server.to(user.roomId).emit("message", message);
      } else {
         // 게임이 시작됐다면 message의 정답 여부를 위해 message를 체크
         this.gameService.checkMessage(message.content, user.roomId);
      }
   }
}

// 게임 담당 게이트웨이
@WebSocketGateway({
   //네임스페이스 game 설정
   namespace: "katch-catch",
   //모든 접근자 초기화
   cors: {
      origin: "*",
   },
})
export class GameGateway {
   constructor(
      private gameService: GameService,
      private roomSettingService: RoomSettingService,
   ) {}

   // 서버를 선언해 브로드캐스트 환경
   @WebSocketServer()
   server: Server;

   // 게임시작
   @SubscribeMessage("start-game")
   async gameStart(socket: Socket) {
      // 유저정보를 그림그리는 사람을 랜덤으로 정하여 서버에게 보내기
      const defaultUsers: Game_user[] = this.gameService.setDefaultGameUser(socket.id);
      const GameUsers: Game_user[] = this.gameService.setRandomDrawer(defaultUsers);
      this.server.to(GameUsers[0].roomId).emit("started game", GameUsers);

      // 게임 시작신호 메세지를 확인하기 위함
      this.roomSettingService.gameStart(GameUsers[0].roomId);
   }
}
