import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class passwordDto {
   @IsOptional()
   @IsString({ message: "비밀번호는 문자열입니다." })
   @IsNotEmpty({ message: "비밀번호는 빈 값이 아닙니다." })
   readonly password: string | null;
}
