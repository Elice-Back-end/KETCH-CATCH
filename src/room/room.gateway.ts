import {
   ConnectedSocket,
   OnGatewayConnection,
   SubscribeMessage,
   WebSocketGateway,
   WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { roomSettingDto } from "src/room/dto/room-setting.dto";
import { userDto } from "src/room/dto/user.dto";
import { RoomService } from "./room.service";
import { RoomSettingService } from "src/data/room/room-setting.service";
import { UserService } from "src/data/user/user.service";
import { passwordDto } from "./dto/password.dto";

@WebSocketGateway({ namespace: "ketch-catch" })
export class RoomGateway implements OnGatewayConnection {
   @WebSocketServer() server: Server;

   constructor(
      private roomService: RoomService,
      private roomSettingService: RoomSettingService,
      private userService: UserService,
   ) {}

   // 클라이언트 접속 시
   handleConnection() {
      this.roomService.initialCreateRoom();
   }

   // 방 생성
   @SubscribeMessage("create-room")
   async createRoom(socket: Socket, data: { userData: userDto; roomSetting: roomSettingDto }) {
      // this.roomService.exitRoom(socket); // 기존에 있던 방 나가기
      const { userData, roomSetting } = data;
      const { roomId, users } = await this.roomService.createRoom(socket.id, userData, roomSetting);
      if (roomId === undefined || users === undefined) return; // 오류 발생 시
      const message = `${userData}님이 입장하셨습니다.`;

      // room 입장
      socket.join(roomId);

      this.server.emit("notice", message); // 입장 메시지 보냄
      this.server.emit("pending-room", users); // roomId 방에 있는 유저들 정보 보냄
   }

   // 랜덤 룸 입장
   @SubscribeMessage("entrance-random-room")
   async randomRoom(socket: Socket, userData: userDto) {
      // this.roomService.exitRoom(socket); // 기존에 있던 방 나가기
      // Room List 복사
      let roomList = this.roomSettingService.room.map((room) => {
         return {
            roomId: room.roomId,
            participants: room.participants,
            password: room.password,
            isStart: room.isStart,
         };
      });

      const { roomId, users } = await this.roomService.randomRoom(socket.id, userData, roomList);
      if (roomId === undefined || users === undefined) return; // 오류 발생 시
      const message = `${userData.nickname}님이 입장하셨습니다.`;

      socket.join(roomId);
      this.server.to(roomId).emit("notice", message); // 입장 메시지 보냄
      this.server.to(roomId).emit("pending-room", users); // roomId 방에 있는 유저들 정보 보냄
   }

   //    // 초대 코드 입장
   @SubscribeMessage("entrance-invited-room")
   async invitedRoom(socket: Socket, data: { userData: userDto; authenticationCode: string; password: passwordDto }) {
      // this.roomService.exitRoom(socket); // 기존에 있던 방 나가기
      const { userData, authenticationCode, password } = data;
      const { roomId, users } = await this.roomService.invitedRoom(socket.id, userData, authenticationCode, password);
      if (data === undefined) return;
      const message = `${userData.nickname}님이 입장하셨습니다.`;
      socket.join(roomId);

      // roomId 방에 있는 유저들 정보 보냄
      this.server.emit("pending-room", users);
      this.server.emit("notice", message);
   }

   //    // 방 수정
   //    @SubscribeMessage("update-room")
   //    async updateRoom(socket: Socket, roomSetting: roomSettingDto) {
   //       const roomId = await this.roomService.updateRoom(socket.id, roomSetting);
   //       if (roomId === undefined) return; // 오류 발생 시

   //       this.server.to(roomId).emit("pending-room", { ...roomSetting });
   //       this.server.to(roomId).emit("notice", { message: "방 설정이 수정되었습니다." });
   //    }

   //    // 방 나가기
   //    @SubscribeMessage("leave-room")
   //    exitRoom(@ConnectedSocket() socket: Socket) {
   //       const { roomId, nickname } = this.roomService.exitRoom(socket);
   //       if (roomId === undefined || nickname === undefined) return;

   //       const users = this.roomService.pendingRoomUsers(roomId);

   //       this.userService.deleteUser(socket.id); // 나간 유저 정보 지움
   //       this.server.to(roomId).emit("notice", { message: `${nickname}님이 방을 나갔습니다.` });
   //       this.server.to(roomId).emit("join-room", users);
   //    }
}
