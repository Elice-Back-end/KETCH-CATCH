import { OnGatewayConnection, SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { roomSettingDto } from "src/room/dto/room-setting.dto";
import { userDto } from "src/room/dto/user.dto";
import { RoomService } from "./room.service";
import { RoomSettingService } from "src/data/room/room-setting.service";

@WebSocketGateway({ namespace: "room" })
export class RoomGateway implements OnGatewayConnection {
   constructor(
      private roomService: RoomService,
      private roomSettingService: RoomSettingService,
   ) {}

   handleConnection() {
      this.roomService.initialCreateRoom();
   }

   @SubscribeMessage("make-room")
   async createRoom(socket: Socket, data: { user: userDto; roomSetting: roomSettingDto }) {
      const { roomId, payload } = await this.roomService.createRoom(data.user, data.roomSetting);

      // room 입장
      socket.join(roomId);
      socket.to(roomId).emit("made-room", payload);
   }

   // 랜덤 룸 입장
   @SubscribeMessage("entrance-random-room")
   async randomRoom(socket: Socket, data: { user: userDto }) {
      // Room List 복사
      let roomList = this.roomSettingService.room.map((room) => {
         return { roomId: room.roomId, person: room.person, password: room.password, isStart: room.isStart };
      });

      const payload = await this.roomService.randomRoom(data.user, roomList);

      socket.join(payload.roomId);
      socket.to(payload.roomId).emit("entranced-random-room", payload);
   }
}
