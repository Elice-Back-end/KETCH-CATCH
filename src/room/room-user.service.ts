import { Injectable } from "@nestjs/common";
import { RoomSettingService } from "src/data/room/room-setting.service";
import { UserService } from "src/data/user/user.service";

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
         return { id: count++, name: user.nickname, score: 0, avatar: user.avatar };
      });

      const roomIndex = this.roomSettingService.room.findIndex((room) => room.roomId === roomId);
      // client에게 보낼 데이터
      const payload = {
         gameState: "pending",
         code: `${process.env.INVITATION_CODE}${roomIndex}`,
         users,
         host: users[0].id,
         drawer: users[0].id,
         participants: users.length,
      };

      return payload;
   }
}