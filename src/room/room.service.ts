import {
   BadRequestException,
   ForbiddenException,
   Injectable,
   NotFoundException,
   UnauthorizedException,
} from "@nestjs/common";
import { userDto } from "./dto/user.dto";
import { roomSettingDto } from "./dto/room-setting.dto";
import { UserService } from "src/data/user/user.service";
import { RoomSettingService } from "src/data/room/room-setting.service";
import { nanoid } from "nanoid";
import * as bcrypt from "bcrypt";
import { Response } from "express";

@Injectable()
export class RoomService {
   private round: number;
   private time: number;
   private person: number;
   private gameMode: string;
   private password: string | null;
   private hint: boolean;
   private isCheck: boolean;

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
      this.isCheck = false;
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
   async createRoom(userData: userDto, roomData: roomSettingDto): Promise<{ isHost: boolean; roomId: string }> {
      const err = await Promise.all([
         this.userService.validData(userData),
         this.roomSettingService.validData(roomData),
      ]);

      const { round, time, person, gameMode, password, hint } = roomData;

      if (err.every((result) => result !== undefined) === false) return; // dto 유효성 검증 오류가 발생한 경우

      const roomId = nanoid(); // 랜덤한 roomId 생성
      const payload: { isHost: boolean; roomId: string } = {
         isHost: true,
         roomId,
      };

      // 패스워드가 null이 아닌 경우 해시화
      const roomPassword = password === null ? null : await bcrypt.hash(password, 10);

      this.userService.register({ ...userData, roomId, isHost: payload.isHost, isCheck: this.isCheck });
      this.roomSettingService.registerRoom({
         roomId,
         round,
         time,
         person,
         gameMode,
         password: roomPassword,
         hint,
         isStart: false,
      });
      return payload;
   }

   // 랜덤 room 입장
   async randomRoom(
      userData: userDto,
      roomList: { roomId: string; person: number; password: string | null; isStart: boolean }[],
   ): Promise<{ isHost: boolean; roomId: string }> {
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
         };

         this.userService.register({ ...userData, roomId: payload.roomId, isHost, isCheck: this.isCheck });
         return payload;
      }

      const { roomId, person, password, isStart } = roomList[randomIndex];
      // roomId인 방에 속해있는 참여자들 조회
      const participants = this.userService.findUsers(roomId);
      let payload: { isHost: boolean; roomId: string } = {
         isHost,
         roomId,
      };

      // full방일 경우, 게임 시작했을 경우, 비밀번호 존재할 경우
      if (participants.length === person || password !== null || isStart === true) {
         roomList = roomList.filter((room) => room.roomId !== roomId);
         return this.randomRoom(userData, roomList);
      }

      // 방에 처음 들어온 사람인 경우(= host인 경우)
      if (participants.length === 0) {
         payload.isHost = true;
         this.userService.register({ ...userData, roomId, isHost: payload.isHost, isCheck: this.isCheck });
         return payload;
      }
      this.userService.register({ ...userData, roomId, isHost, isCheck: this.isCheck });
      return payload;
   }

   // 초대코드 확인
   checkInvititaionCode(invitationCode: string, res: Response) {
      try {
         // 초대코드가 조건에 부합하지 않는 경우
         if (new RegExp(process.env.INVITATION_CODE_REX).test(invitationCode) === false) {
            throw new BadRequestException("잘못된 초대코드입니다. 다시 입력해주세요.");
         }

         // 초대코드에 해당하는 방이 없는 경우
         const roomId = invitationCode.slice(process.env.INVITATION_CODE.length);
         const foundRoom = this.roomSettingService.findOneRoom(roomId);
         if (foundRoom === undefined) {
            throw new NotFoundException({
               err: "종료된 방입니다. 홈페이지로 돌아갑니다.",
               redirectUrl: process.env.HOMEPAGE_URL,
            });
         }

         // 게임이 시작했을 경우
         if (foundRoom.isStart) {
            throw new ForbiddenException({
               err: "이미 게임이 시작되어 입장이 불가합니다.",
               redirectUrl: process.env.HOMEPAGE_URL,
            });
         }

         // 인원이 다 찼을 경우
         const participants = this.userService.findUsers(roomId);
         if (foundRoom.person <= participants.length) {
            throw new ForbiddenException({
               err: "참여 인원 초과로 입장이 불가합니다.",
               redirectUrl: process.env.HOMEPAGE_URL,
            });
         }

         res.set({ authentication: roomId })
            .status(200)
            .json({ err: null, data: { password: foundRoom.password } });
      } catch (e) {
         throw e;
      }
   }

   // 비밀번호 확인
   async checkPassword(res: Response, authenticationCode: string, password: string, userData: userDto) {
      try {
         if (authenticationCode === undefined || authenticationCode.trim() === "" || authenticationCode === null) {
            throw new UnauthorizedException("초대코드를 확인해주세요.");
         }

         const foundRoom = this.roomSettingService.findOneRoom(authenticationCode);
         // 방이 없는 경우
         if (foundRoom === undefined) {
            throw new NotFoundException({
               err: "종료된 방입니다. 홈페이지로 돌아갑니다.",
               redirectUrl: process.env.HOMEPAGE_URL,
            });
         }

         // 비밀번호가 null이 아닌 경우
         if (foundRoom.password !== null) {
            const isPassword = await bcrypt.compare(password, foundRoom.password);
            // 비밀번호가 일치하지 않는 경우
            if (isPassword === false) {
               throw new BadRequestException("비밀번호가 일치하지 않습니다.");
            }
         }

         // 게임이 시작했을 경우
         if (foundRoom.isStart) {
            throw new ForbiddenException({
               err: "이미 게임이 시작되어 입장이 불가합니다.",
               redirectUrl: process.env.HOMEPAGE_URL,
            });
         }

         // 인원이 다 찼을 경우
         const participants = this.userService.findUsers(authenticationCode);
         if (foundRoom.person <= participants.length) {
            throw new ForbiddenException({
               err: "참여 인원 초과로 입장이 불가합니다.",
               redirectUrl: process.env.HOMEPAGE_URL,
            });
         }

         this.userService.register({ ...userData, roomId: authenticationCode, isHost: false, isCheck: true });
         res.status(200).json({ err: null, data: "비밀번호 확인 완료되었습니다." });
      } catch (e) {
         throw e;
      }
   }

   // 초대 코드 입장
   async invitedRoom(
      roomId: string,
      password: string,
      userData: userDto,
   ): Promise<{ isHost: boolean; roomId: string }> {
      const err = await this.userService.validData(userData);
      if (err === undefined) return; // dto 유효성 검증 오류가 발생한 경우

      // 예외처리 로직 거침(roomId 확인하고 password까지 확인함)
      const payload: { isHost: boolean; roomId: string } = {
         isHost: false,
         roomId,
      };
      this.userService.register({ ...userData, roomId, isHost: payload.isHost, isCheck: false });
      return payload;
   }
}
