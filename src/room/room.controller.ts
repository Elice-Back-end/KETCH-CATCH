import { Body, Controller, Headers, Post, Res } from "@nestjs/common";
import {
   ApiBadRequestResponse,
   ApiBody,
   ApiForbiddenResponse,
   ApiHeader,
   ApiInternalServerErrorResponse,
   ApiNotFoundResponse,
   ApiOkResponse,
   ApiOperation,
   ApiTags,
   ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { invitationCodeDto } from "./dto/invitation.dto";
import { RoomService } from "./room.service";
import { Response } from "express";
import { passwordDto } from "./dto/password.dto";

@ApiTags("Room Entrance")
@Controller("room")
export class RoomController {
   constructor(private roomService: RoomService) {}

   // 초대코드 확인
   @Post("invitation")
   @ApiOperation({ summary: "초대코드 확인 API" })
   @ApiOkResponse({ description: "초대코드 확인", example: { err: null, data: { password: "string" } } })
   @ApiBadRequestResponse({
      description: "Bad Request",
      example: {
         err: "초대 코드는 문자열입니다. | 초대 코드는 빈 값이 아닙니다. | 잘못된 초대코드입니다. 다시 입력해주세요.",
         data: null,
      },
   })
   @ApiForbiddenResponse({
      description: "Forbidden",
      example: {
         err: "이미 게임이 시작되어 입장이 불가합니다. | 참여 인원 초과로 입장이 불가합니다.",
         redirectUrl: "홈페이지 URL",
      },
   })
   @ApiNotFoundResponse({
      description: "Not Found",
      example: { err: "종료된 방입니다. 홈페이지로 돌아갑니다.", redirectUrl: "홈페이지 URL" },
   })
   @ApiInternalServerErrorResponse({
      description: "Internal Server Error",
      example: { err: "서버 오류입니다. 잠시 후 다시 이용해주세요.", data: null },
   })
   checkInvitationCode(@Res({ passthrough: true }) res: Response, @Body() invitationCode: invitationCodeDto) {
      return this.roomService.checkInvititaionCode(invitationCode.invitationCode, res);
   }

   // 비밀번호 확인
   @Post("check-password")
   @ApiOperation({ summary: "비밀번호 확인 API" })
   @ApiHeader({ name: "authentication", description: "초대 코드 확인 시 응답으로 받은 헤더 값" })
   @ApiBody({
      schema: {
         example: {
            password: "string",
            userData: {
               nickname: "string",
               socketId: "string",
               character: { eye: "string", color: "string", ghost: "string" },
            },
         },
      },
   })
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
         err: "비밀번호는 빈 값이 아닙니다. | 비밀번호가 일치하지 않습니다.",
         data: null,
      },
   })
   @ApiUnauthorizedResponse({
      description: "UnAuthorized",
      example: {
         err: "초대 코드를 확인해주세요.",
         data: null,
      },
   })
   @ApiForbiddenResponse({
      description: "Forbidden",
      example: {
         err: "이미 게임이 시작되어 입장이 불가합니다. | 참여 인원 초과로 입장이 불가합니다.",
         redirectUrl: "홈페이지 URL",
      },
   })
   @ApiNotFoundResponse({
      description: "Not Found",
      example: { err: "종료된 방입니다. 홈페이지로 돌아갑니다.", redirectUrl: "홈페이지 URL" },
   })
   @ApiInternalServerErrorResponse({
      description: "Internal Server Error",
      example: { err: "서버 오류입니다. 잠시 후 다시 시도해주세요.", data: null },
   })
   async checkPassword(
      @Res({ passthrough: true }) res: Response,
      @Headers("authentication") authenticationCode: string,
      @Body() data: passwordDto,
   ) {
      return await this.roomService.checkPassword(res, authenticationCode, data);
   }
}
