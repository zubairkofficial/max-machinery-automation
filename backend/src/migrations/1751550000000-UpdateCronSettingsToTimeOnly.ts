import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCronSettingsToTimeOnly1751550000000 implements MigrationInterface {
    name = 'UpdateCronSettingsToTimeOnly1751550000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update the cron_settings table to use varchar for time-only storage
        await queryRunner.query(`ALTER TABLE "cron_settings" ALTER COLUMN "startTime" TYPE varchar`);
        await queryRunner.query(`ALTER TABLE "cron_settings" ALTER COLUMN "endTime" TYPE varchar`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert back to timestamp columns
        await queryRunner.query(`ALTER TABLE "cron_settings" ALTER COLUMN "startTime" TYPE timestamp`);
        await queryRunner.query(`ALTER TABLE "cron_settings" ALTER COLUMN "endTime" TYPE timestamp`);
    }
} 