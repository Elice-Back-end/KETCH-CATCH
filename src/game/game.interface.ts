import { User} from "src/data/user/user.interface";
import { Room } from "src/data/room/room.interface";
export interface Game_user extends User{
    isDrawer : boolean,
    score : number
}

export interface Game_room extends Room{


}