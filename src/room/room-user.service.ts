import { Injectable } from "@nestjs/common";
import { RoomSettingService } from "src/data/room/room-setting.service";
import { UserService } from "src/data/user/user.service";
import { GameState } from "../game/types/gameState";

@Injectable()
export class RoomUserService {
   constructor(
      private userService: UserService,
      private roomSettingService: RoomSettingService,
   ) {}

   getUsers(roomId: string) {
      let count = 0;
      const foundUsers = this.userService.findUsers(roomId);
      // 대기 방 안에 있는 유저들
      const users = foundUsers.map((user) => {
         return { id: count++, nickname: user.nickname, score: 0 };
      });
      const foundRoom = this.roomSettingService.findOneRoom(roomId);
      // client에게 보낼 데이터
      const payload = {
         gameState: foundRoom.isStart ? GameState.Playing : GameState.Pending,
         code: roomId,
         users,
         host: users[0].id,
         drawer: users[0].id,
         participants: users.length,
      };

      return payload;
   }
}
