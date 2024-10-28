import { Injectable } from '@nestjs/common';
import { Game_user } from './game.interface';
import { RoomSettingService } from 'src/data/room/room-setting.service';
import { UserService } from 'src/data/user/user.service';
import { Room } from 'src/data/room/room.interface';
import { catch_word } from 'src/data/word';


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

    setGameRoom(roomId : string){
        // roomId를 통해 roomID를 가진 room의 정보를 받아옴
        const setRoom : Room = this.roomSettingService.findOneRoom(roomId);
        // 게임 시간을 밀리초로 변환
        const playTime : number = setRoom.time * 1000;
    }

    // 단어에서 round만큼 랜덤한 숫자를 반환
    getRandomWorld(roomId:string): string[]{
        const RWlist = catch_word;
        const room: Room = this.roomSettingService.findOneRoom(roomId);
        const round = room.round;

        function getRandomW(RWlist:string[], round:number):string[]{
            const shuffle = RWlist.sort(()=>0.5 - Math.random());
            return shuffle.slice(0, round);
        }

        return getRandomW(RWlist, round);
    }

    checkMessage(message: string ,roomId: string){

    }

    throwInit(){

    }
    
    throwUserScore(){

    }

    nextRound(){

    }

    GoToHome(){

    }
    RetryGame(){

    }

}
