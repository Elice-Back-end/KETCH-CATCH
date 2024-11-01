import { Injectable } from "@nestjs/common";
import { Game_user } from "./game.interface";
import { RoomSettingService } from "src/data/room/room-setting.service";
import { UserService } from "src/data/user/user.service";
import { Room } from "src/data/room/room.interface";
import { catch_word } from "src/data/word";
import { RoomUserService } from "src/room/room-user.service";
import { Socket } from "socket.io";
import { GameState } from "./types/gameState";

@Injectable()
export class GameService {
   // 의존성 주입을 위해 constructor 생성
   constructor(
      private userService: UserService,
      private roomSettingService: RoomSettingService,
      private roomUserService: RoomUserService,
   ) {}
   // 문제리스트 
   answerList: object[] = [];
   
   // 게임시작시 유저들의 게임 정보를 기본값으로 초기화
   setDefaultGameInfo(socketId: string, currentRoom: string):object {
      // 초기유저정보를 가져옴
      const users = this.userService.findUsers(currentRoom);
      // 방정보
      const room: Room = this.roomSettingService.findOneRoom(currentRoom);
       
      // 초기유저정보에 게임에 필요한 정보를 추가하여 새로운 게임 유저 리스트 생성
      const setDefaultUser = users.map((...user) => ({
         ...user,
         score: 0
      }));

      //랜덤으로 그림그리는사람 선택
      const randomIndex = Math.floor(Math.random() * setDefaultUser.length);

      //문제 가져오기
      const RWlist = catch_word;
      const round = room.round;
      const randomAnswer = {currentRoom : RWlist.sort(() => 0.5 - Math.random()).slice(0, round)};
      this.answerList.push(randomAnswer);

      const payload = {
         gameState : GameState.Playing, //게임상태
         time : room.time, //게임시간
         round : room.round, //게임라운드
         problem : randomAnswer[0], //첫번째 문제(단어 : 힌트)
         users: setDefaultUser, // 유저정보
         darwer: randomIndex, // 그림그리는사람
         participants : users.length // 참가자
      }

      // 게임유저정보 반환
      return payload;
   }

   // 랜덤으로 한명만 그림그리는 사람 선택
   setRandomDrawer(GameUsers: Game_user[]): Game_user[] {
      // 게임유저들의 정보를 false로 초기화
      const setDefaultUser = GameUsers.map((user) => ({
         ...user,
         isDrawer: false,
      }));

      // 게임유저수의 맞게 랜덤 index 생성
      const randomIndex = Math.floor(Math.random() * setDefaultUser.length);
      // 해당 index의 유저를 그림그리는 사람으로 결정
      setDefaultUser[randomIndex].isDrawer = true;
      // 배열 반환
      return setDefaultUser;
   }

   nextRound(GameUsers: Game_user[]) {

   }

   finishGame() {
      // 게임끝나고 랭킹 넘길때, 게임 중 유저객체를 넘길때 처럼 넘겨주냐 아니면 랭킹에 관한 정보만 넘겨주냐?
      // 저희가 걸러주는게 맞나요?
   }

   RetryGame(socket: Socket) {
      const [_, currentRoom] = Array.from(socket.rooms); // _ : 자기 자신, currentRoom : 현재 속해 있는 방
      const users = this.roomUserService.getUsers(currentRoom); // 방에 속해 있는 유저들 정보
      const nickname = this.userService.findOneUser(currentRoom, socket.id).nickname;

      return { roomId: currentRoom, users, nickname };
   }
}
