import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJobNameEnum1751550000001 implements MigrationInterface {
    name = 'AddJobNameEnum1751550000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type
        await queryRunner.query(`CREATE TYPE "public"."job_name_enum" AS ENUM ('ScheduledCalls', 'RescheduleCall', 'ReminderCall')`);
        
        // Temporarily alter jobName to allow null
        await queryRunner.query(`ALTER TABLE "cron_settings" ALTER COLUMN "jobName" DROP NOT NULL`);
        
        // Add new column with enum type
        await queryRunner.query(`ALTER TABLE "cron_settings" ADD COLUMN "jobName_new" "public"."job_name_enum"`);
        
        // Copy data to new column
        await queryRunner.query(`UPDATE "cron_settings" SET "jobName_new" = "jobName"::job_name_enum`);
        
        // Drop old column and rename new column
        await queryRunner.query(`ALTER TABLE "cron_settings" DROP COLUMN "jobName"`);
        await queryRunner.query(`ALTER TABLE "cron_settings" RENAME COLUMN "jobName_new" TO "jobName"`);
        
        // Make jobName not null and unique
        await queryRunner.query(`ALTER TABLE "cron_settings" ALTER COLUMN "jobName" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "cron_settings" ADD CONSTRAINT "UQ_jobName" UNIQUE ("jobName")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove constraints
        await queryRunner.query(`ALTER TABLE "cron_settings" DROP CONSTRAINT "UQ_jobName"`);
        
        // Add temporary column
        await queryRunner.query(`ALTER TABLE "cron_settings" ADD COLUMN "jobName_old" varchar`);
        
        // Copy data
        await queryRunner.query(`UPDATE "cron_settings" SET "jobName_old" = "jobName"::text`);
        
        // Drop enum column and rename old column back
        await queryRunner.query(`ALTER TABLE "cron_settings" DROP COLUMN "jobName"`);
        await queryRunner.query(`ALTER TABLE "cron_settings" RENAME COLUMN "jobName_old" TO "jobName"`);
        
        // Make jobName not null and unique
        await queryRunner.query(`ALTER TABLE "cron_settings" ALTER COLUMN "jobName" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "cron_settings" ADD CONSTRAINT "UQ_jobName" UNIQUE ("jobName")`);
        
        // Drop enum type
        await queryRunner.query(`DROP TYPE "public"."job_name_enum"`);
    }
} 