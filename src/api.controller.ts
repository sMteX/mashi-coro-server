import { Body, Controller, Post } from '@nestjs/common';
import { Game } from '@app/database/entities/game.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Validator } from 'class-validator';

const validator = new Validator();

@Controller('api')
export class ApiController {
    constructor(
        @InjectRepository(Game) private readonly gameRepository: Repository<Game>
    ) {}

    @Post('/createGame')
    async createGame(): Promise<string> {
        let game = new Game();
        game = await this.gameRepository.save(game);
        return game.slug;
    }

    @Post('/validateGame')
    async validateGameSlug(@Body() data: { slug: string; }): Promise<{success: boolean, full?: boolean}> {
        if (!validator.isUUID(data.slug)) {
            return { success: false, full: false };
        }
        const game = await this.gameRepository.findOne({
            where: {
                slug: data.slug
            },
            relations: ['players']
        });
        if (!game) {
            return { success: false, full: false };
        }
        if (game.players.length <= 3) { // this is BEFORE joining, so there must be at most 3 players (careful, it might change in the time before this validation and actually joining)
            return { success: true };
        }
        return { success: false, full: true };
    }
}
