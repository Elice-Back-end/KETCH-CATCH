import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { userDto } from "./user.dto";
import { Type } from "class-transformer";

export class passwordDto {
   @ApiProperty({ description: "방 비밀번호" })
   @IsString({ message: "비밀번호는 문자열입니다." })
   @IsNotEmpty({ message: "비밀번호는 빈 값이 아닙니다." })
   readonly password: string;

   @ApiProperty({ description: "유저 정보" })
   @ValidateNested() // 중첩된 객체에 대한 유효성 검사 활성화
   @Type(() => userDto)
   readonly userData: userDto;
}
