import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewCallFields1711391000000 implements MigrationInterface {
    name = 'AddNewCallFields1711391000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "call_history" ADD "duration_ms" integer`);
        await queryRunner.query(`ALTER TABLE "call_history" ADD "disconnection_reason" character varying`);
        await queryRunner.query(`ALTER TABLE "call_history" ADD "opt_out_sensitive_data_storage" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "call_history" ADD "opt_in_signed_url" boolean NOT NULL DEFAULT false`);
        
        // Update latency and callCost columns to use the new structure
        await queryRunner.query(`ALTER TABLE "call_history" ALTER COLUMN "latency" TYPE jsonb USING latency::jsonb`);
        await queryRunner.query(`ALTER TABLE "call_history" ALTER COLUMN "call_cost" TYPE jsonb USING call_cost::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "call_history" DROP COLUMN "opt_in_signed_url"`);
        await queryRunner.query(`ALTER TABLE "call_history" DROP COLUMN "opt_out_sensitive_data_storage"`);
        await queryRunner.query(`ALTER TABLE "call_history" DROP COLUMN "disconnection_reason"`);
        await queryRunner.query(`ALTER TABLE "call_history" DROP COLUMN "duration_ms"`);
        
        // Revert latency and callCost columns to their original structure
        await queryRunner.query(`ALTER TABLE "call_history" ALTER COLUMN "latency" TYPE jsonb USING '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "call_history" ALTER COLUMN "call_cost" TYPE jsonb USING '{}'::jsonb`);
    }
} 