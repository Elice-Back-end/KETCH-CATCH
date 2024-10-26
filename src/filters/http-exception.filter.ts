import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Response } from "express";

// HTTP 예외 처리 필터
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
   private readonly logger = new Logger(HttpExceptionFilter.name); // Logger 초기화

   catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp(); // HTTP 요청 & 응답 객체 가져오도록 전환
      const res = ctx.getResponse<Response>(); // Express의 response 가져옴

      // exception이 httpException인 경우 status code 가져옴
      // 아닌 경우 status code = 500
      const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

      // 서버 내부 오류인 경우
      if (status === 500) {
         const stackTrace = exception instanceof Error ? exception.stack.split("\n") : ["No stack available"];
         this.logger.error({
            error: exception instanceof HttpException ? exception.getResponse() : "Non-HTTP Exception",
            stack: stackTrace,
         });
      }

      // exception이 httpException인 경우 예외 응답 메시지 가져옴
      // 아닌 경우 예외 응답 메시지 = 서버 오류 메시지
      const errRes =
         exception instanceof HttpException
            ? exception.getResponse()
            : { err: "서버 오류입니다. 잠시 후 다시 시도해주세요.", data: null };

      // 에러메시지 타입이 문자열인 경우 {err: "에러 메새지", data: null} 형태로 바꿔줌
      const err = typeof errRes === "string" ? { err: errRes, data: null } : errRes;
      // 상태 코드, 에러 메시지 보냄
      res.status(status).json({ ...err });
   }
}