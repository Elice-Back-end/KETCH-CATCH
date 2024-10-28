import { IsNotEmpty, IsString } from "class-validator";

export class avartarDto {
   @IsString({ message: "눈은 문자열이어야 합니다." })
   @IsNotEmpty({ message: "눈은 빈 값이 아니어야 합니다." })
   readonly eye: string;

   @IsString({ message: "캐릭터 외형은 문자열이어야 합니다." })
   @IsNotEmpty({ message: "캐릭터 외형은 빈 값이 아니어야 합니다." })
   readonly body: string;
}
