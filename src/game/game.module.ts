import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway, ChatGateway } from './game.gateway';

@Module({
  providers: [GameService, GameGateway, ChatGateway]
})
export class GameModule {}
