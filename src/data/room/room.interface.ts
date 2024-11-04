export interface Room {
   roomId: string; // 룸 고유 ID
   round: number; // 게임 라운드
   time: number; // 게임 시간
   participants: number; // 참여자 수
   password: string | null; // 방 비밀번호
   isStart: boolean; // 게임 시작 여부
}
