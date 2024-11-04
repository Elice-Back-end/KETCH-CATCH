import { IsNotEmpty, IsString } from "class-validator";

export class userDto {
   @IsString({ message: "닉네임은 문자열이어야 합니다." })
   @IsNotEmpty({ message: "닉네임은 빈 값이 아니어야 합니다." })
   readonly nickname: string;
}
