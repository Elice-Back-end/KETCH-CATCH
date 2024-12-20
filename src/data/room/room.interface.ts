export interface Room {
   roomId: string; // 룸 고유 ID
   round: number; // 게임 라운드
   time: number; // 게임 시간
   person: number; // 참여자 수
   gameMode: string; // 게임 모드
   password: string | null; // 방 비밀번호
   hint: boolean; // 게임 힌트
   isStart: boolean; // 게임 시작 여부
}
