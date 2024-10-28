import { IsNotEmpty, IsNotEmptyObject, IsObject, IsString, ValidateNested } from "class-validator";
import { avartarDto } from "./avatar.dto";
import { Type } from "class-transformer";

export class userDto {
   @IsString({ message: "닉네임은 문자열이어야 합니다." })
   @IsNotEmpty({ message: "닉네임은 빈 값이 아니어야 합니다." })
   readonly nickname: string;

   @IsString({ message: "소켓 id는 문자열이어야 합니다." })
   @IsNotEmpty({ message: "소켓 id는 빈 값이 아니어야 합니다." })
   readonly socketId: string;

   @IsNotEmptyObject({ nullable: false }, { message: "캐릭터는 빈 값이 아니어야 합니다." })
   @IsObject({ message: "캐릭터는 object 타입이어야 합니다." })
   @ValidateNested() // 중첩된 객체에 대한 유효성 검사 활성화
   @Type(() => avartarDto)
   readonly avatar: avartarDto;
}
