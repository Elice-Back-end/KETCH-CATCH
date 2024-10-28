import { OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { roomSettingDto } from "src/room/dto/room-setting.dto";
import { userDto } from "src/room/dto/user.dto";
import { RoomService } from "./room.service";
import { RoomSettingService } from "src/data/room/room-setting.service";

@WebSocketGateway({ namespace: "room" })
export class RoomGateway implements OnGatewayConnection {
   @WebSocketServer() server: Server;

   constructor(
      private roomService: RoomService,
      private roomSettingService: RoomSettingService,
   ) {}

   // 클라이언트 접속 시
   handleConnection() {
      this.roomService.initialCreateRoom();
   }

   // 방 생성
   @SubscribeMessage("make-room")
   async createRoom(socket: Socket, data: { user: userDto; roomSetting: roomSettingDto }) {
      const [_, currentRoom] = Array.from(socket.rooms);
      // 다른 방에 들어가있을 경우
      if (currentRoom) {
         socket.leave(currentRoom);
      }

      const payload = await this.roomService.createRoom(data.user, data.roomSetting);
      if (payload === undefined) return; // 오류 발생 시

      // room 입장
      socket.join(payload.roomId);
      // roomId 방에 있는 유저들 정보 보냄
      this.server.to(payload.roomId).emit("join-room", this.roomService.findUsers(payload.roomId));
      socket.emit("made-room", payload);
   }

   // 랜덤 룸 입장
   @SubscribeMessage("entrance-random-room")
   async randomRoom(socket: Socket, data: { user: userDto }) {
      const [_, currentRoom] = Array.from(socket.rooms);
      // 다른 방에 들어가있을 경우
      if (currentRoom) {
         socket.leave(currentRoom);
      }

      // Room List 복사
      let roomList = this.roomSettingService.room.map((room) => {
         return { roomId: room.roomId, person: room.person, password: room.password, isStart: room.isStart };
      });

      const payload = await this.roomService.randomRoom(data.user, roomList);

      if (payload === undefined) return; // 오류 발생 시

      socket.join(payload.roomId);
      // roomId 방에 있는 유저들 정보 보냄
      this.server.to(payload.roomId).emit("join-room", this.roomService.findUsers(payload.roomId));
      socket.emit("entranced-random-room", payload);
   }

   // 초대 코드 입장
   @SubscribeMessage("entrance-invited-room")
   async invitedRoom(socket: Socket, data: { user: userDto; authenticationCode: string }) {
      const [_, currentRoom] = Array.from(socket.rooms);
      // 다른 방에 들어가있을 경우
      if (currentRoom) {
         socket.leave(currentRoom);
      }

      const payload = await this.roomService.invitedRoom(data.user, data.authenticationCode);
      if (payload === undefined) return;

      socket.join(payload.roomId);
      // roomId 방에 있는 유저들 정보 보냄
      this.server.to(payload.roomId).emit("join-room", this.roomService.findUsers(payload.roomId));
      socket.emit("entranced-invited-room", payload);
   }
}
