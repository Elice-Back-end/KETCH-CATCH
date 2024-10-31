import { Injectable } from "@nestjs/common";
import { roomSettingDto } from "src/room/dto/room-setting.dto";
import { Room } from "./room.interface";

@Injectable()
export class RoomSettingService {
   room: Room[] = [];

   // 방 등록
   registerRoom(roomData: Room) {
      this.room.push(roomData);
   }

   // 방 조회
   findOneRoom(roomId: string): Room {
      return this.room.find((room) => room.roomId === roomId);
   }

   // 방 수정
   updateRoom(roomId: string, updateData: roomSettingDto) {
      this.deleteRoom(roomId);
      this.registerRoom({ roomId, ...updateData, isStart: false });
   }

   // 방 삭제
   deleteRoom(roomId: string) {
      this.room = this.room.filter((room) => room.roomId !== roomId);
   }

   // 게임시작
   gameStart(roomId: string) {
      this.room.forEach((room) => {
         if (room.roomId === roomId) {
            room.isStart = true;
         }
      });
   }
}
