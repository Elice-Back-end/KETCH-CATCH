import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, MessageBody, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server} from 'socket.io';
import { GameService } from './game.service';
import { Game_user } from './game.interface';
import { RoomSettingService } from 'src/data/room/room-setting.service';

//채팅담당 게이트웨이
@WebSocketGateway({
  //네임스페이스 chat 설정
  namespace : "chat",
  //모든 접근자 초기화
  cors : {
    origin : "*",
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // 서버를 선언해 브로드캐스트 환경
  @WebSocketServer()
  server: Server; 
  
  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }
  
  @SubscribeMessage('message')
  handleMessage(client: Socket, @MessageBody() message:{sender : string, content : string}){
    // 메세지 확인용 콘솔 개발완료시 삭제
    console.log(message);
    // 서버에 받은 메세지를 뿌리기
    this.server.emit('message' , message);
  }
}

// 게임 담당 게이트웨이
@WebSocketGateway({
  //네임스페이스 game 설정
  namespace : "game",
  //모든 접근자 초기화
  cors : {
    origin : "*",
  },
})
export class GameGateway {
  constructor(
    private gameService : GameService,
    private roomSettingService : RoomSettingService
  ){}
  
  // 서버를 선언해 브로드캐스트 환경
  @WebSocketServer()
  server: Server; 
  
  // 게임시작 
  @SubscribeMessage('start-game')
  async gameStart(socket : Socket){
    
    // 게임 초기 유저정보
    const defaultUsers: Game_user[] = this.gameService.setDefaultGameUser(socket.id);
    // 그림그리는 사람이 선택된 유저정보
    const GameUsers: Game_user[] = this.gameService.setRandomDrawer(defaultUsers);
    // 유저들의 room에 유저정보 발송
    this.server.to(GameUsers[0].roomId).emit("started game",GameUsers);
  }
}