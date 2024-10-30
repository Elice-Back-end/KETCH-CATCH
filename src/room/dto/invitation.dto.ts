import { ApiProperty, PickType } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class invitationDto {
   @ApiProperty({ description: "초대 코드" })
   @IsString({ message: "초대 코드는 문자열입니다." })
   @IsNotEmpty({ message: "초대 코드는 빈 값이 아닙니다." })
   readonly invitationCode: string;
}

export class invitationCodeDto extends PickType(invitationDto, ["invitationCode"] as const) {}
