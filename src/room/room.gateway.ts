import { SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { roomSettingDto } from "src/room/dto/room-setting.dto";
import { userDto } from "src/room/dto/user.dto";
import { nanoid } from "nanoid";
import { UserService } from "src/data/user/user.service";
import { RoomService } from "./room.service";

@WebSocketGateway({ namespace: "room" })
export class RoomGateway {
   private round: number;
   private time: number;
   private person: number;
   private gameMode: string;
   private password: string | null;
   private hint: boolean;

   constructor(
      private userService: UserService,
      private roomService: RoomService,
   ) {
      this.round = 8;
      this.time = 60;
      this.person = 4;
      this.gameMode = "easy mode";
      this.password = null;
      this.hint = false;
   }

   room = [];

   @SubscribeMessage("make-room")
   async createRoom(socket: Socket, data: { user: userDto; roomSetting: roomSettingDto }) {
      const { roomId, payload } = await this.roomService.createRoom(data);

      this.room.push({ roomId, ...data.roomSetting });
      // room 입장
      socket.join(roomId);
      socket.to(roomId).emit("made-room", payload);
   }
}
