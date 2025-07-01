import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNameAndRoleToUser1658291854 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add name column with default value based on username
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "name" character varying
      DEFAULT NULL
    `);

    // Update name based on username for existing records
    await queryRunner.query(`
      UPDATE "users"
      SET "name" = "username"
      WHERE "name" IS NULL
    `);

    // Make name column NOT NULL after setting default values
    await queryRunner.query(`
      ALTER TABLE "users" 
      ALTER COLUMN "name" SET NOT NULL
    `);

    // Add role column with default 'user' value
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "role" character varying
      DEFAULT 'user'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "role"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "name"`);
  }
} 