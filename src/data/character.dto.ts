import { IsNotEmpty, IsString } from "class-validator";

export class characterDto {
   @IsString({ message: "눈은 문자열이어야 합니다." })
   @IsNotEmpty({ message: "눈은 빈 값이 아니어야 합니다." })
   readonly eye: string;

   @IsString({ message: "캐릭터 색깔은 문자열이어야 합니다." })
   @IsNotEmpty({ message: "캐릭터 색깔은 빈 값이 아니어야 합니다." })
   readonly color: string;

   @IsString({ message: "캐릭터 모양은 문자열이어야 합니다." })
   @IsNotEmpty({ message: "캐릭터 모양은 빈 값이 아니어야 합니다." })
   readonly ghost: string;
}
