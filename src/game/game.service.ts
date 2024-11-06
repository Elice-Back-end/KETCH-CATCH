import { Injectable } from "@nestjs/common";
import { Game_user, Game_round } from "./game.interface";
import { RoomSettingService } from "src/data/room/room-setting.service";
import { UserService } from "src/data/user/user.service";
import { Room } from "src/data/room/room.interface";
import { catch_word } from "src/data/word";
import { RoomUserService } from "src/room/room-user.service";
import { Socket, Server } from "socket.io";
import { GameState } from "./types/gameState";
import { WebSocketServer } from "@nestjs/websockets";
import { GameGateway } from "./game.gateway";

@Injectable()
export class GameService {
   // 의존성 주입을 위해 constructor 생성
   constructor(
      private userService: UserService,
      private roomSettingService: RoomSettingService,
      private roomUserService: RoomUserService,
      private gameGateway: GameGateway,
   ) {}
   @WebSocketServer()
   server: Server;

   // 문제리스트
   answerList: { currentRoom: string; questions: string[] }[] = [];

   // 게임중 user 관리 리스트
   gameUsers: { currentRoom: string; users: Game_user[]; cntUsers: number[] }[] = [];

   // 게임중 round 관리 리스트
   gameRound: Game_round[] = [];

   // 게임시작시 유저들의 게임 정보를 기본값으로 초기화
   setDefaultGameInfo(socketId: string, currentRoom: string): object {
      // 초기유저정보를 가져옴
      const users = this.userService.findUsers(currentRoom);
      // 방정보
      const room: Room = this.roomSettingService.findOneRoom(currentRoom);
      // 유저 정답관리 리스트
      const cntUsers = [];

      // 초기유저정보에 게임에 필요한 정보를 추가하여 새로운 게임 유저 리스트 생성
      // 그 후 게임 유저 리스트에 저장
      const setDefaultUser: Game_user[] = users.map((user) => ({
         ...user,
         score: 0,
      }));
      this.gameUsers.push({ currentRoom, users: setDefaultUser, cntUsers });

      //랜덤으로 그림그리는사람 선택
      const randomIndex = Math.floor(Math.random() * setDefaultUser.length);

      //문제 가져오기
      const RWlist = catch_word;
      const round = room.round;
      const randomAnswer = RWlist.sort(() => 0.5 - Math.random()).slice(0, round);
      this.answerList.push({ currentRoom, questions: randomAnswer });

      // payload 가공
      const payload = {
         gameState: GameState.Playing, //게임상태
         time: room.time, //게임시간
         round: room.round, //게임라운드
         problem: randomAnswer[0], //첫번째 문제
         users: setDefaultUser, // 유저정보
         darwer: randomIndex, // 그림그리는사람
         participants: users.length, // 참가자
      };

      // 게임유저정보 반환
      return payload;
   }
   // 잘 됩니다 ^^
   plusScore(idx: number, roomId: string) {
      // 게임 유저 데이터를 불러옴
      const gameUserData = this.gameUsers.find((item) => item.currentRoom === roomId);
      const { users, cntUsers } = gameUserData;

      // 정답자 리스트에 해당 유저 삽입 후 내림차순 정리
      cntUsers.push(idx);
      cntUsers.sort((a, b) => b - a);

      // 정답자에게 순차적으로 점수부과
      users[idx].score = users[idx].score + (110 - cntUsers.length * 10);

      // payload 가공
      const payload = {
         users: users,
         answerUser: cntUsers,
      };

      return payload;
   }

   gameStart(roomId: string) {
      // 해당 룸아이디를 가진 룸을 가져옴
      const room = this.roomSettingService.findOneRoom(roomId);

      // 게임이 시작된것을 저장
      room.isStart = true;

      // 룸의 방설정에 맞게 timer 설정
      const timeOut = setTimeout(() => {
         this.nextRound(roomId);
      }, room.time * 1000);

      // 라운드를 관리하는 리스트에 정보 저장
      this.gameRound.push({ currnetRoom: roomId, nowRound: 1, timer: timeOut });
   }

   nextRound(roomId: string) {
      // 해당 방에 있는 게임유저 데이터와 게임룸 데이터를 가져옴
      const gameUserData = this.gameUsers.find((item) => item.currentRoom == roomId);
      const gameRoomData = this.gameRound.find((item) => item.currnetRoom == roomId);
      const room = this.roomSettingService.findOneRoom(roomId);

      // 문제리스트에 문제들을 구조분해할당으로 가져옴
      const { questions } = this.answerList.find((item) => item.currentRoom == roomId);

      // 마지막 라운드일 경우 finishGame 호출
      if (gameRoomData.nowRound === room.round) {
         this.finishGame(roomId);
      } else {
         // 전라운드에 진행했던 timer 삭제 후, 새로운 타이머 주입
         clearTimeout(gameRoomData.timer);
         const timeOut = setTimeout(() => {
            this.nextRound(roomId);
         }, room.time * 1000);
         gameRoomData.timer = timeOut;

         // 유저의 score를 내림차순으로 정리
         const { users } = gameUserData;
         const sortedUser = users.sort((a, b) => b.score - a.score);
         // 그림그리는 사람 선택
         const randomIndex = Math.floor(Math.random() * sortedUser.length);
         // 정답자 초기화
         gameUserData.cntUsers = [];
         // 라운드 증가
         gameRoomData.nowRound++;
         // payload 데이터 가공
         const payload = {
            gamestat: GameState.Playing,
            time: room.time,
            problem: questions[gameRoomData.nowRound - 1],
            users: sortedUser,
            drawer: randomIndex,
         };
         // room에 payload 수신
         this.gameGateway.emitEvent(roomId, payload);
      }
   }

   inGameExit(socket: Socket, roomId: string) {
      // socket에 해당하는 유저데이터와 정답자 배열 가져오기
      const { users, cntUsers } = this.gameUsers.find((item) => item.currentRoom === roomId);

      // 해당 유저의 idx번호
      const userIdx = users.findIndex((u) => u.socketId === socket.id);

      // 해당유저의 idx의 cntUser 내부의 idx번호
      const uIdx = cntUsers.indexOf(userIdx);

      // 정답자에 있다면 삭제후 정답자보다 큰 idx를 가진 유저들의 idx를 1씩 낮춤
      if (uIdx !== -1) {
         cntUsers.filter((idx) => idx !== userIdx);
         for (let i = uIdx; i < cntUsers.length; i++) {
            cntUsers[i]--;
         }
      }
      // 정답자에 없다면 해당 정답자보다 큰 idx를 가진 유저들의 idx를 1씩 낮춤
      else {
         for (let i = 0; i < cntUsers.length; i++) {
            if (cntUsers[i] > userIdx) {
               cntUsers[i]--;
            }
         }
      }

      // 해당방의 유저 삭제
      users.filter((user) => user.socketId === socket.id);

      // payload 데이터 가공
      const payload = {
         participants: users.length,
         answerUser: cntUsers,
      };

      return payload;
   }

   finishGame(roomId: string) {
      // 해당 방에 있는 게임유저 데이터를 해당 룸에게 보내기 위해 가져옴
      const gameUserData = this.gameUsers.find((item) => item.currentRoom == roomId);

      // 유저의 게임정보를 내림차순으로 정리
      const { users } = gameUserData;
      const sortedUser = users.sort((a, b) => b.score - a.score);

      // payload 데이터 가공
      const payload = {
         gamestate: GameState.Finished,
         users: sortedUser,
         participants: sortedUser.length,
      };

      // 게임데이터 삭제
      this.gameUsers = this.gameUsers.filter((item) => item.currentRoom !== roomId);
      this.gameRound = this.gameRound.filter((item) => item.currnetRoom !== roomId);

      // 가공 된 데이터 반환
      return payload;
   }

   RetryGame(socket: Socket) {
      const [_, currentRoom] = Array.from(socket.rooms); // _ : 자기 자신, currentRoom : 현재 속해 있는 방
      const users = this.roomUserService.getUsers(currentRoom); // 방에 속해 있는 유저들 정보
      const nickname = this.userService.findOneUser(currentRoom, socket.id).nickname;

      return { roomId: currentRoom, users, nickname };
   }
}
