import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { userDto } from "./dto/user.dto";
import { roomSettingDto } from "./dto/room-setting.dto";
import { UserService } from "src/data/user/user.service";
import { RoomSettingService } from "src/data/room/room-setting.service";
import { nanoid } from "nanoid";
import * as bcrypt from "bcrypt";
import { Response } from "express";
import { passwordDto } from "./dto/password.dto";
import { AppGateway } from "src/app.gateway";
import { RoomUserService } from "./room-user.service";
import { DtoService } from "./dto/dto.service";

@Injectable()
export class RoomService {
   private round: number;
   private time: number;
   private participants: number;
   private gameMode: string;
   private password: string | null;

   constructor(
      private userService: UserService,
      private roomSettingService: RoomSettingService,
      private appGateway: AppGateway,
      private roomUserService: RoomUserService,
      private dtoService: DtoService,
   ) {
      this.round = 3;
      this.time = 60;
      this.participants = 4;
      this.gameMode = "easy mode";
      this.password = null;
   }

   // 초기 방 생성
   initialCreateRoom() {
      const randomRoomList = [];
      const payload = {
         round: this.round,
         time: this.time,
         participants: this.participants,
         gameMode: this.gameMode,
         password: this.password,
         isStart: false,
      };
      // 룸이 하나라도 존재할 경우
      if (this.roomSettingService.room.length !== 0) return;

      for (let i = 0; i < 5; i++) {
         let roomId = nanoid();
         randomRoomList.push(roomId);
         this.userService.initialRoom(roomId);
         this.roomSettingService.registerRoom({ roomId, ...payload });
      }
      return randomRoomList;
   }

   // room 생성
   async createRoom(socketId: string, userData: userDto, roomData: roomSettingDto) {
      // dto 유효성 검증
      const err = await Promise.all([this.dtoService.userValidData(userData), this.dtoService.roomValidData(roomData)]);

      if (err.every((result) => result !== undefined) === false) return { roomId: undefined, users: undefined }; // dto 유효성 검증 오류가 발생한 경우

      const { round, time, participants, gameMode, password } = roomData;
      const roomId = nanoid(); // 랜덤한 roomId 생성
      // 패스워드가 null이 아닌 경우 해시화
      const roomPassword = password === null ? null : await bcrypt.hash(password, 10);

      // 사용자 등록
      this.userService.register(roomId, { socketId, ...userData, isHost: true });
      // room 등록
      this.roomSettingService.registerRoom({
         roomId,
         round,
         time,
         participants,
         gameMode,
         password: roomPassword,
         isStart: false,
      });
      // client로 보낼 유저들 정보
      const users = this.roomUserService.getUsers(roomId);
      return { roomId, users };
   }

   // 랜덤 room 입장
   async randomRoom(
      socketId: string,
      userData: userDto,
      roomList: { roomId: string; participants: number; password: string | null; isStart: boolean }[],
   ) {
      const err = await this.dtoService.userValidData(userData);
      if (err === undefined) return { roomId: undefined, users: undefined }; // dto 유효성 검증 오류가 발생한 경우

      // randomRoomId 생성
      let randomIndex = Math.floor(Math.random() * roomList.length);
      let isHost = false;

      // 방이 존재하지 않을 경우
      if (roomList[randomIndex] === undefined) {
         const randomRoomList = this.initialCreateRoom(); // 방 생성
         randomIndex = Math.floor(Math.random() * randomRoomList.length);
         const roomId = randomRoomList[randomIndex]; // 랜덤 방 ID
         isHost = true;

         // 유저 등록
         this.userService.register(roomId, { socketId, ...userData, isHost });
         const users = this.roomUserService.getUsers(roomId);
         return { roomId, users };
      }

      const { roomId, participants, password, isStart } = roomList[randomIndex];
      // roomId인 방에 속해있는 참여자들 조회
      const foundParticipants = this.userService.findUsers(roomId);

      // full방일 경우, 게임 시작했을 경우, 비밀번호 존재할 경우
      // 다른 random 방 찾음
      if (foundParticipants.length === participants || password !== null || isStart === true) {
         roomList = roomList.filter((room) => room.roomId !== roomId);
         return this.randomRoom(socketId, userData, roomList);
      }

      // 방에 처음 들어온 사람인 경우(= host인 경우) -> isHost = true
      // 아니면 false
      isHost = foundParticipants.length === 0 ? true : false;
      this.userService.register(roomId, { socketId, ...userData, isHost });
      // client로 보낼 유저들 정보
      const users = this.roomUserService.getUsers(roomId);
      return { roomId, users };
   }

   // 초대코드 확인
   checkInvititaionCode(invitationCode: string, res: Response) {
      try {
         // 초대코드가 조건에 부합하지 않는 경우
         if (new RegExp(process.env.INVITATION_CODE_REX).test(invitationCode) === false) {
            throw new BadRequestException({ err: "잘못된 초대코드입니다. 다시 입력해주세요.", data: null });
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
         const foundParticipants = this.userService.findUsers(roomId);
         if (foundRoom.participants <= foundParticipants.length) {
            throw new ForbiddenException({
               err: "참여 인원 초과로 입장이 불가합니다.",
               redirectUrl: process.env.HOMEPAGE_URL,
            });
         }

         res.set({ authentication: roomId })
            .status(200)
            .json({ err: null, data: { password: foundRoom.password === null ? null : "string" } });
      } catch (e) {
         throw e;
      }
   }

   // 비밀번호 확인
   async checkPassword(authenticationCode: string, password: string) {
      if (authenticationCode === undefined || authenticationCode.trim() === "" || authenticationCode === null) {
         this.appGateway.handleError({ err: "초대코드를 확인해주세요.", data: null });
         return;
      }

      const roomId = authenticationCode;
      const foundRoom = this.roomSettingService.findOneRoom(roomId);
      // 방이 없는 경우
      if (foundRoom === undefined) {
         this.appGateway.handleError({
            err: "종료된 방입니다. 홈페이지로 돌아갑니다.",
            redirectUrl: process.env.HOMEPAGE_URL,
         });
         return;
      }

      // 비밀번호가 null이 아닌 경우
      if (foundRoom.password !== null) {
         const isPassword = await bcrypt.compare(password, foundRoom.password);

         // 비밀번호가 일치하지 않는 경우
         if (isPassword === false) {
            this.appGateway.handleError({ err: "비밀번호가 일치하지 않습니다.", data: null });
            return;
         }
      }

      // 게임이 시작했을 경우
      if (foundRoom.isStart) {
         this.appGateway.handleError({
            err: "이미 게임이 시작되어 입장이 불가합니다.",
            redirectUrl: process.env.HOMEPAGE_URL,
         });
         return;
      }

      // 인원이 다 찼을 경우
      const foundParticipants = this.userService.findUsers(roomId);
      if (foundRoom.participants <= foundParticipants.length) {
         this.appGateway.handleError({
            err: "참여 인원 초과로 입장이 불가합니다.",
            redirectUrl: process.env.HOMEPAGE_URL,
         });
         return;
      }
      return true;
   }

   // 초대 코드 입장
   async invitedRoom(socketId: string, userData: userDto, authenticationCode: string, password: passwordDto) {
      const err = await Promise.all([
         this.dtoService.userValidData(userData),
         this.dtoService.passwordValidData(password),
      ]);

      if (err.every((result) => result !== undefined) === false) return { roomId: undefined, users: undefined }; // dto 유효성 검증 오류가 발생한 경우

      const roomId = this.roomSettingService.room[parseInt(authenticationCode)].roomId;
      console.log(roomId);
      console.log(`socketId : ${socketId}`);

      const foundRoom = this.roomSettingService.findOneRoom(roomId);

      // 비밀번호가 없는 경우
      if (foundRoom.password === null) {
         this.userService.register(roomId, { socketId, ...userData, isHost: false });
         const users = this.roomUserService.getUsers(roomId);
         console.log(this.userService.findUsers(roomId));
         return { roomId, users };
      }

      const isCheck = await this.checkPassword(authenticationCode, password.password);
      if (isCheck === undefined) return { roomId: undefined, users: undefined };
      // 유저 등록
      this.userService.register(roomId, { ...userData, socketId, isHost: false });

      const users = this.roomUserService.getUsers(roomId);

      return { roomId, users };
   }

   //    // 방 수정
   //    async updateRoom(socketId: string, updateRoomData: roomSettingDto) {
   //       const err = await this.roomSettingService.validData(updateRoomData);
   //       if (err === undefined) return; // dto 유효성 검증 오류가 발생한 경우

   //       const foundUser = this.userService.findOneUser(socketId);
   //       // 유저가 존재하지 않는 경우
   //       if (foundUser === undefined) {
   //          this.appGateway.handleError({ err: "존재하지 않는 유저입니다.", data: null });
   //          return;
   //       }

   //       // 호스트가 아닌 경우
   //       if (foundUser.isHost === false) {
   //          this.appGateway.handleError({ err: "호스트만 설정을 바꿀 수 있습니다.", data: null });
   //       }
   //       const roomId = foundUser.roomId;
   //       const foundRoom = this.roomSettingService.findOneRoom(roomId);
   //       // 방이 존재하지 않는 경우
   //       if (foundRoom === undefined) {
   //          this.appGateway.handleError({ err: "종료된 방입니다.", data: null });
   //          return;
   //       }

   //       this.roomSettingService.updateRoom(foundRoom.roomId, updateRoomData);
   //       return roomId;
   //    }

   //    // 방 나가기
   //    exitRoom(socket: Socket) {
   //       const [_, currentRoom] = Array.from(socket.rooms); // _ : 자기 자신, currentRoom : 현재 속해 있는 방
   //       socket.leave(currentRoom); // 방 떠나기

   //       const foundUser = this.userService.findOneUser(socket.id);

   //       // 유저가 없는 경우
   //       if (foundUser === undefined) return;

   //       const roomId = foundUser.roomId;

   //       // 유저가 나간 방에 존재하는 다른 유저들
   //       const foundUsers = this.userService.findUsers(roomId);

   //       // 방에 아무도 없을 경우
   //       if (foundUsers.length === 0) {
   //          this.roomSettingService.deleteRoom(roomId);
   //          return;
   //       }

   //       // 나간 유저가 호스트인 경우
   //       if (foundUser.isHost) {
   //          // 그 다음으로 들어온 유저가 호스트
   //          foundUsers[0].isHost = true;
   //       }

   //       return { roomId, nickname: foundUser.nickname };
   //    }
}
