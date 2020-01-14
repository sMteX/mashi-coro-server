import { Controller, Post } from '@nestjs/common';
import { Game } from '@app/database/entities/game.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('api')
export class ApiController {
    constructor(
        @InjectRepository(Game) private readonly gameRepository: Repository<Game>
    ) {}

    @Post('/createGame')
    async createGame(): Promise<string> {
        // TODO: Step 2 - create game, send some sort of token back
        let game = new Game();
        game = await this.gameRepository.save(game);
        return game.slug;
    }

    @Post('/validateGame')
    async validateGameSlug(slug: string): Promise<boolean> {
        // TODO: verify if the slug is correct and the game is playable probably
        const game = await this.gameRepository.findOne({ slug });
        return !!game;
    }
}
