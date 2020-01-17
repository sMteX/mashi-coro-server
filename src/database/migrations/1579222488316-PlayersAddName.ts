import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlayersAddName1579222488316 implements MigrationInterface {
    name = 'PlayersAddName1579222488316';

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE `player` ADD `name` varchar(255) NOT NULL', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE `player` DROP COLUMN `name`', undefined);
    }

}
