import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLeadTrackingFields1751550000002 implements MigrationInterface {
    name = 'AddLeadTrackingFields1751550000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leads" ADD COLUMN "formSubmitted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "leads" ADD COLUMN "linkClicked" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "leads" ADD COLUMN "formSubmittedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "leads" ADD COLUMN "linkClickedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "linkClickedAt"`);
        await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "formSubmittedAt"`);
        await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "linkClicked"`);
        await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "formSubmitted"`);
    }
} 