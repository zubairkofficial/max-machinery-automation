import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddVerificationTokenTable1693892310000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'verification_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'token',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'used',
            type: 'boolean',
            default: 'false',
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'contactEmail',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'contactPhone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'contactFirstName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'contactLastName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'leadId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'verification_tokens',
      new TableForeignKey({
        columnNames: ['leadId'],
        referencedTableName: 'leads',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('verification_tokens');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('leadId') !== -1,
    );
    await queryRunner.dropForeignKey('verification_tokens', foreignKey);
    await queryRunner.dropTable('verification_tokens');
  }
} 