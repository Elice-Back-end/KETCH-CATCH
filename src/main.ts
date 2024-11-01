import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { HttpExceptionFilter } from "./filters/http-exception.filter";

async function bootstrap() {
   const app = await NestFactory.create(AppModule);

   app.setGlobalPrefix("api"); // 등록된 모든 경로의 접두사 api로 설정
   app.useGlobalFilters(new HttpExceptionFilter()); // HTTP 예외처리 필터를 전역 예외처리 필터로 설정
   app.enableCors({ origin: process.env.CORS_URL }); // cors 설정

   // swagger 설정
   const config = new DocumentBuilder()
      .setTitle("KETCH-CATCH API")
      .setDescription("실시간 그림 그리기 게임 API 문서")
      .setVersion("1.0")
      .build();

   const documentFactory = () => SwaggerModule.createDocument(app, config);
   SwaggerModule.setup("api-docs", app, documentFactory);
   app.useGlobalPipes(
      new ValidationPipe({
         forbidUnknownValues: true,
         whitelist: true,
         forbidNonWhitelisted: true,
      }),
   );
   await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
