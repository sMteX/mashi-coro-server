import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostreSQLMigrate1581807631218 implements MigrationInterface {
    name = 'PostreSQLMigrate1581807631218';

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('CREATE TABLE "player" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "gameId" integer, CONSTRAINT "PK_65edadc946a7faf4b638d5e8885" PRIMARY KEY ("id"))', undefined);
        await queryRunner.query('CREATE TABLE "game" ("id" SERIAL NOT NULL, "slug" uuid NOT NULL DEFAULT uuid_generate_v4(), CONSTRAINT "PK_352a30652cd352f552fef73dec5" PRIMARY KEY ("id"))', undefined);
        await queryRunner.query('ALTER TABLE "player" ADD CONSTRAINT "FK_7dfdd31fcd2b5aa3b08ed15fe8a" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE "player" DROP CONSTRAINT "FK_7dfdd31fcd2b5aa3b08ed15fe8a"', undefined);
        await queryRunner.query('DROP TABLE "game"', undefined);
        await queryRunner.query('DROP TABLE "player"', undefined);
    }

}
