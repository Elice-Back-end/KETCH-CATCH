import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { userDto } from "./dto/user.dto";
import { roomSettingDto } from "./dto/room-setting.dto";
import { UserService } from "src/data/user/user.service";
import { RoomSettingService } from "src/data/room/room-setting.service";
import { nanoid } from "nanoid";

@Injectable()
export class RoomService {
   private round: number;
   private time: number;
   private person: number;
   private gameMode: string;
   private password: string | null;
   private hint: boolean;

   constructor(
      private userService: UserService,
      private roomSettingService: RoomSettingService,
   ) {
      this.round = 3;
      this.time = 60;
      this.person = 4;
      this.gameMode = "easy mode";
      this.password = null;
      this.hint = false;
   }

   // 초기 방 생성
   initialCreateRoom() {
      const randomRoomList = [];
      const payload = {
         round: this.round,
         time: this.time,
         person: this.person,
         gameMode: this.gameMode,
         password: this.password,
         hint: this.hint,
         isStart: false,
      };
      // 룸이 하나라도 존재할 경우
      if (this.roomSettingService.room.length !== 0) return;

      for (let i = 0; i < 5; i++) {
         let roomId = nanoid();
         randomRoomList.push(roomId);
         this.roomSettingService.registerRoom({ roomId, ...payload });
      }
      return randomRoomList;
   }

   // room 생성
   async createRoom(userData: userDto, roomData: roomSettingDto) {
      const err = await Promise.all([
         this.userService.validData(userData),
         this.roomSettingService.validData(roomData),
      ]);

      if (err.every((result) => result !== undefined) === false) return; // dto 유효성 검증 오류가 발생한 경우

      const roomId = nanoid(); // 랜덤한 roomId 생성
      const payload: { host: string; roomId: string; message: string } = {
         host: userData.socketId,
         roomId,
         message: "방이 생성되었습니다.",
      };

      this.userService.register({ ...userData, roomId, isHost: true });
      this.roomSettingService.registerRoom({ roomId, ...roomData, isStart: false });
      return { roomId, payload };
   }

   // 랜덤 room 입장
   async randomRoom(
      userData: userDto,
      roomList: { roomId: string; person: number; password: string | null; isStart: boolean }[],
   ): Promise<{ isHost: boolean; roomId: string; message: string }> {
      const err = await this.userService.validData(userData);
      if (err === undefined) return; // dto 유효성 검증 오류가 발생한 경우

      // randomRoomId 생성
      let randomIndex = Math.floor(Math.random() * roomList.length);
      let isHost = false;

      // 방이 존재하지 않을 경우
      if (roomList[randomIndex] === undefined) {
         const randomRoomList = this.initialCreateRoom();
         randomIndex = Math.floor(Math.random() * randomRoomList.length);
         isHost = true;
         const payload = {
            isHost,
            roomId: randomRoomList[randomIndex],
            message: `${userData.nickname}님이 입장하였습니다.`,
         };

         this.userService.register({ ...userData, roomId: payload.roomId, isHost });
         return payload;
      }

      const { roomId, person, password, isStart } = roomList[randomIndex];
      // roomId인 방에 속해있는 참여자들 조회
      const participants = this.userService.findUsers(roomId);
      let payload = {
         isHost,
         roomId,
         message: `${userData.nickname}님이 입장하였습니다.`,
      };

      // full방일 경우, 게임 시작했을 경우, 비밀번호 존재할 경우
      if (participants.length === person || password !== null || isStart === true) {
         roomList = roomList.filter((room) => room.roomId !== roomId);
         return this.randomRoom(userData, roomList);
      }

      // 방에 처음 들어온 사람인 경우(= host인 경우)
      if (participants.length === 0) {
         payload.isHost = true;
         this.userService.register({ ...userData, roomId, isHost: payload.isHost });
         return payload;
      }
      this.userService.register({ ...userData, roomId, isHost });
      return payload;
   }
}
