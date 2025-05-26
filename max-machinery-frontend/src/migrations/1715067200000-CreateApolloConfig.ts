import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateApolloConfig1715067200000 implements MigrationInterface {
    name = 'CreateApolloConfig1715067200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "apollo_config" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "apiKey" character varying,
                "jobTitles" jsonb,
                "industries" jsonb,
                "locations" jsonb,
                "companySize" character varying,
                "keywords" character varying,
                "companyNames" jsonb,
                "emailStatus" character varying,
                "limit" integer NOT NULL DEFAULT 25,
                "page" integer NOT NULL DEFAULT 1,
                "cronSchedule" character varying NOT NULL DEFAULT '0 0 * * *',
                "isActive" boolean NOT NULL DEFAULT true,
                "lastRunAt" TIMESTAMP,
                "nextRunAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_e48e774da0d6525df08c93c613a" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "apollo_config"`);
    }
} 