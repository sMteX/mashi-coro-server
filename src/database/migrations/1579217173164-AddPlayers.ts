import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlayers1579217173164 implements MigrationInterface {
    name = 'AddPlayers1579217173164';

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('CREATE TABLE `player` (`id` int NOT NULL AUTO_INCREMENT, `socketId` varchar(255) NOT NULL, `gameId` int NULL, UNIQUE INDEX `IDX_3f1542c09ef5d46e8fbc956a46` (`socketId`), PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('ALTER TABLE `player` ADD CONSTRAINT `FK_7dfdd31fcd2b5aa3b08ed15fe8a` FOREIGN KEY (`gameId`) REFERENCES `game`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE `player` DROP FOREIGN KEY `FK_7dfdd31fcd2b5aa3b08ed15fe8a`', undefined);
        await queryRunner.query('DROP INDEX `IDX_3f1542c09ef5d46e8fbc956a46` ON `player`', undefined);
        await queryRunner.query('DROP TABLE `player`', undefined);
    }

}
