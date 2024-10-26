import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator";

export class roomSettingDto {
   @IsInt({ message: "라운드는 숫자여야 합니다." })
   @Min(1, { message: "라운드는 1라운드 이상이어야 합니다." })
   @Max(30, { message: "라운드는 30라운드 이하여야 합니다." })
   readonly round: number;

   @IsInt({ message: "게임 시간은 숫자여야 합니다." })
   @Min(30, { message: "게임 시간은 최소 30초입니다." })
   @Max(180, { message: "게임 시간은 최대 3분입니다." })
   readonly time: number;

   @IsInt({ message: "참여 인원은 숫자여야 합니다." })
   @Min(2, { message: "참여자는 2명 이상이어야 합니다." })
   @Max(8, { message: "참여자는 8명 이하여야 합니다." })
   readonly person: number;

   @IsString({ message: "게임모드는 문자열이어야 합니다." })
   @IsNotEmpty({ message: "게임모드는 빈 값이 아니어야 합니다." })
   readonly gameMode: string;

   @IsOptional()
   @IsString({ message: "비밀번호는 문자열이어야 합니다." })
   @IsNotEmpty({ message: "비밀번호는 빈 값이 아니어야 합니다." })
   readonly password: string | null;

   @IsBoolean({ message: "힌트는 boolean값이어야 합니다." })
   readonly hint: boolean;
}
