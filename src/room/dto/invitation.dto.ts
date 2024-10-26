import { ApiProperty, PickType } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class invitationDto {
   @ApiProperty({ description: "초대 코드" })
   @IsString({ message: "초대 코드는 문자열입니다." })
   @IsNotEmpty({ message: "초대 코드는 빈 값이 아닙니다." })
   readonly invitationCode: string;

   @ApiProperty({ description: "방 비밀번호" })
   @IsString({ message: "비밀번호는 문자열입니다." })
   @IsNotEmpty({ message: "비밀번호는 빈 값이 아닙니다." })
   readonly password: string;
}

export class invitationCodeDto extends PickType(invitationDto, ["invitationCode"] as const) {}

export class passwordDto extends PickType(invitationDto, ["password"] as const) {}
