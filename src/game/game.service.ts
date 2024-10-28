import { Injectable } from '@nestjs/common';
import { Game_room, Game_user } from './game.interface';
import { RoomSettingService } from 'src/data/room/room-setting.service';
import { UserService } from 'src/data/user/user.service';
import { RmOptions } from 'fs';

@Injectable()
export class GameService {
    // 의존성 주입을 위해 constructor 생성
    constructor(
        private userService: UserService,
        private roomSettingService : RoomSettingService
    ) {}

    // 게임시작시 유저들의 게임 정보를 기본값으로 초기화 
    setDefaultGameUser(socketId: string): Game_user[]{
        // 초기유저정보를 가져옴
        const users = this.userService.findUsers(socketId);

        // 초기유저정보에 게임에 필요한 정보를 추가하여 새로운 게임 유저 리스트 생성
        const GameUsers: Game_user[] = users.map(user => ({
            ...user,
            isDrawer : false,
            score : 0
        }));

        // 게임유저정보 반환
        return GameUsers;
    }

    // 랜덤으로 한명만 그림그리는 사람 선택
    setRandomDrawer(GameUsers: Game_user[]) : Game_user[]{
        // 게임유저들의 정보를 false로 초기화
        const setDefaultUser = GameUsers.map(user =>({
            ...user,
            isDrawer : false
        }));
        
        // 게임유저수의 맞게 랜덤 index 생성
        const randomIndex = Math.floor(Math.random() * setDefaultUser.length);
        // 해당 index의 유저를 그림그리는 사람으로 결정
        setDefaultUser[randomIndex].isDrawer = true;
        // 배열 반환
        return setDefaultUser;
    }

    // 게임의 설정
    setGame(socketId:string){

    }

    checkMessage(){

    }

    throwInit(){

    }
    
    throwUserScore(){

    }

    changeDrawer(){

    }
    
    nextRound(){

    }

    GoToHome(){

    }
    RetryGame(){

    }

}
