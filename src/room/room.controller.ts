import { Body, Controller, Post, Res } from "@nestjs/common";
import {
   ApiBadRequestResponse,
   ApiInternalServerErrorResponse,
   ApiNotFoundResponse,
   ApiOkResponse,
   ApiOperation,
   ApiTags,
} from "@nestjs/swagger";
import { passwordDto } from "./dto/password.dto";
import { RoomService } from "./room.service";
import { userDto } from "./dto/user.dto";
import { Response } from "express";

@ApiTags("Room Entrance")
@Controller("room")
export class RoomController {
   constructor(private roomService: RoomService) {}

   @Post("check-password")
   @ApiOperation({ summary: "비밀번호 확인 API" })
   @ApiOkResponse({
      description: "비밀번호 확인",
      example: {
         err: null,
         data: "비밀번호 확인 완료되었습니다.",
      },
   })
   @ApiBadRequestResponse({
      description: "Bad Request",
      example: {
         err: `초대 코드는 문자열입니다. | 초대 코드는 빈 값이 아닙니다. | 잘못된 초대코드입니다. 다시 입력해주세요. 
             | 비밀번호는 빈 값이 아닙니다. | 비밀번호가 일치하지 않습니다. 
             | 이미 게임이 시작되어 입장이 불가합니다. | 참여 인원 초과로 입장이 불가합니다. `,
         data: null,
      },
   })
   @ApiNotFoundResponse({ description: "Not Found", example: { err: "존재하지 않는 방입니다.", data: null } })
   @ApiInternalServerErrorResponse({
      description: "Internal Server Error",
      example: { err: "서버 오류입니다. 잠시 후 다시 시도해주세요.", data: null },
   })
   checkPassword(
      @Res({ passthrough: true }) res: Response,
      @Body() data: { password: passwordDto; userData: userDto },
   ) {}
}
