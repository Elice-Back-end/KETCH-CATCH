import { User} from "src/data/user/user.interface";

export interface Game_user extends User{
    // 게임 유저 정보에 그림을 그리는사람과 , 점수 기록
    score : number,
}
