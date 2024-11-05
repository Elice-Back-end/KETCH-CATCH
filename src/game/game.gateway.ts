import { SubscribeMessage, WebSocketGateway, MessageBody, WebSocketServer, ConnectedSocket } from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { GameService } from "./game.service";
import { RoomService } from "src/room/room.service";
import { GameState } from "./types/gameState";
import { forwardRef, Inject } from "@nestjs/common";

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
   constructor() {}
   // 서버를 선언해 브로드캐스트 환경
   @WebSocketServer()
   server: Server;
   @SubscribeMessage("message")
   handleMessage(socket: Socket, @MessageBody() message: { sender: string; content: string }) {
      // 메세지 확인용 콘솔 개발완료시 삭제
      console.log(message);
      // 유저와 방의 정보를 가져옴
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
      @Inject(forwardRef(() => GameService))
      private gameService: GameService,
      private roomService: RoomService,
   ) {}

   // 서버를 선언해 브로드캐스트 환경
   @WebSocketServer()
   server: Server;

   // 게임시작
   @SubscribeMessage("start-game")
   async gameStart(@ConnectedSocket() socket: Socket) {
      // roomId 생성
      const [_, currentRoom] = Array.from(socket.rooms);
      // 초기 유저 설정
      const Info = this.gameService.setDefaultGameInfo(socket.id, currentRoom);

      // 게임시작 룸에게 전달데이터 메세지
      this.server.to(currentRoom).emit("started-game", Info);
      this.server.to(currentRoom).emit("notice", "게임이 시작되었습니다.");

      // 게임시작
      this.gameService.gameStart(currentRoom);
   }

   // 게임 중 정답자가 나왔을 경우
   @SubscribeMessage("answer")
   async collectPerson(@ConnectedSocket() socket: Socket, @MessageBody() data: { idx: number }) {
      // roomId 생성
      const [_, currentRoom] = Array.from(socket.rooms);

      // 해당 idx를 가진 사람의 점수를 올려준다.
      const payload = this.gameService.plusScore(data.idx, currentRoom);

      // 룸에 유저정보 반환
      this.server.to(currentRoom).emit("answer", payload);
   }

   // 다음라운드 넘어가기 버튼을 클릭했을 경우
   @SubscribeMessage("next-round")
   async nextRound(@ConnectedSocket() socket: Socket) {
      // roomId 생성
      const [_, currentRoom] = Array.from(socket.rooms);

      // 룸에게 다음 라운드로 가라고 지시한다.
      this.gameService.nextRound(currentRoom);
   }

   // 게임 중 유저가 퇴장했을시
   @SubscribeMessage("in-game-exit")
   inGameExit(@ConnectedSocket() socket: Socket) {
      // roomId, users, nickname 가져옴 / 예외처리
      const { roomId, users, nickname } = this.roomService.exitRoom(socket);
      if (roomId === undefined || users === undefined || nickname === undefined) return;

      // 유저이탈이벤트
      const gameData = this.gameService.inGameExit(socket, roomId);

      const payload = {
         users: users,
         participants: gameData.participants,
         answwerUser: gameData.answerUser,
      };

      const eventName = users.gameState === GameState.Pending ? "pending-room" : "game-room";
      this.server.to(roomId).emit("notice", { message: `${nickname}님이 방을 나갔습니다.` });
      this.server.to(roomId).emit(eventName, payload);
   }

   // 게임 종료
   @SubscribeMessage("finish-game")
   finishGame(@ConnectedSocket() socket: Socket) {
      // roomId 생성
      const [_, currentRoom] = Array.from(socket.rooms);

      // 게임 종료 이벤트
      const payload = this.gameService.finishGame(currentRoom);

      // 룸에게 유저정보 반환
      this.server.to(currentRoom).emit("finished-game", payload);
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

   emitEvent(roomId: string, data: any) {
      this.server.to(roomId).emit("next-round", data);
   }
}
