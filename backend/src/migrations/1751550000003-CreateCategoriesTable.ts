import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateCategoriesTable1751550000003 implements MigrationInterface {
  name = 'CreateCategoriesTable1751550000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create categories table
    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '7',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add categoryId column to leads table
    await queryRunner.query(`
      ALTER TABLE "leads" 
      ADD COLUMN "categoryId" uuid NULL
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "leads" 
      ADD CONSTRAINT "FK_leads_category" 
      FOREIGN KEY ("categoryId") 
      REFERENCES "categories"("id") 
      ON DELETE SET NULL
    `);

    // Create some default categories
    await queryRunner.query(`
      INSERT INTO "categories" ("name", "description", "color", "isActive") VALUES
      ('High Priority', 'High priority leads for immediate follow-up', '#ff4444', true),
      ('Qualified', 'Qualified leads ready for further engagement', '#22c55e', true),
      ('Cold Leads', 'Cold leads requiring nurturing', '#3b82f6', true),
      ('Not Interested', 'Leads that are not interested', '#ef4444', true),
      ('Follow Up', 'Leads requiring follow-up calls', '#f59e0b', true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "leads" 
      DROP CONSTRAINT IF EXISTS "FK_leads_category"
    `);

    // Remove categoryId column from leads table
    await queryRunner.query(`
      ALTER TABLE "leads" 
      DROP COLUMN IF EXISTS "categoryId"
    `);

    // Drop categories table
    await queryRunner.dropTable('categories');
  }
}