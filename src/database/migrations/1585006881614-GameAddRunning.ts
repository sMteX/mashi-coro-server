import { MigrationInterface, QueryRunner } from 'typeorm';

export class GameAddRunning1585006881614 implements MigrationInterface {
    name = 'GameAddRunning1585006881614';

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE "player" DROP CONSTRAINT "FK_7dfdd31fcd2b5aa3b08ed15fe8a"', undefined);
        await queryRunner.query('ALTER TABLE "game" ADD "running" boolean NOT NULL DEFAULT false', undefined);
        await queryRunner.query('ALTER TABLE "player" ADD CONSTRAINT "FK_7dfdd31fcd2b5aa3b08ed15fe8a" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE NO ACTION', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE "player" DROP CONSTRAINT "FK_7dfdd31fcd2b5aa3b08ed15fe8a"', undefined);
        await queryRunner.query('ALTER TABLE "game" DROP COLUMN "running"', undefined);
        await queryRunner.query('ALTER TABLE "player" ADD CONSTRAINT "FK_7dfdd31fcd2b5aa3b08ed15fe8a" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE NO ACTION', undefined);
    }

}
