import {
   OnGatewayConnection,
   OnGatewayDisconnect,
   SubscribeMessage,
   WebSocketGateway,
   MessageBody,
   WebSocketServer,
   ConnectedSocket,
} from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { GameService } from "./game.service";
import { Game_user } from "./game.interface";
import { RoomSettingService } from "src/data/room/room-setting.service";
import { Room } from "src/data/room/room.interface";
import { UserService } from "src/data/user/user.service";
import { User } from "src/data/user/user.interface";
import { RoomService } from "src/room/room.service";
import { GameState } from "./types/gameState";

//채팅담당 게이트웨이
@WebSocketGateway({
   //네임스페이스 chat 설정
   namespace: "ketch-catch",
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
   namespace: "ketch-catch",
   //모든 접근자 초기화
   cors: {
      origin: "*",
   },
})
export class GameGateway {
   constructor(
      private gameService: GameService,
      private roomSettingService: RoomSettingService,
      private roomService: RoomService,
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

   // 게임 종료 후 HOME
   @SubscribeMessage("go-to-home")
   goToHome(@ConnectedSocket() socket: Socket) {
      const { roomId, users, nickname } = this.roomService.exitRoom(socket);
      if (roomId === undefined || users === undefined || nickname === undefined) return;

      const eventName = users.gameState === GameState.Pending ? "pending-room" : "game-room";
      this.server.to(roomId).emit("notice", { message: `${nickname}님이 방을 나갔습니다.` });
      this.server.to(roomId).emit(eventName, users);
   }

   // 게임 종료 후 retry
   @SubscribeMessage("retry-game")
   retryGame(@ConnectedSocket() socket: Socket) {
      // 현재 속해있는 방으로 다시 입장 x -> 돌아가는 것
      // 방을 떠난 게 아니기 때문
      const { roomId, users, nickname } = this.gameService.RetryGame(socket);
      const message = `${nickname}님이 입장하셨습니다.`;

      this.server.to(roomId).emit("pending-room", users);
      this.server.to(roomId).emit("notice", { message });
   }
}
