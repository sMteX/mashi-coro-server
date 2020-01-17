import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlayersRemoveSocket1579260900296 implements MigrationInterface {
    name = 'PlayersRemoveSocket1579260900296';

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('DROP INDEX `IDX_3f1542c09ef5d46e8fbc956a46` ON `player`', undefined);
        await queryRunner.query('ALTER TABLE `player` DROP COLUMN `socketId`', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE `player` ADD `socketId` varchar(255) NOT NULL', undefined);
        await queryRunner.query('CREATE UNIQUE INDEX `IDX_3f1542c09ef5d46e8fbc956a46` ON `player` (`socketId`)', undefined);
    }

}
