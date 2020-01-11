import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGame1578781349630 implements MigrationInterface {
    name = 'AddGame1578781349630';

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('CREATE TABLE `game` (`id` int NOT NULL AUTO_INCREMENT, `slug` varchar(36) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('DROP TABLE `game`', undefined);
    }

}
