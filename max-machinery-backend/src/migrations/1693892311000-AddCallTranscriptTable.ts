import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddCallTranscriptTable1693892311000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'call_transcripts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'callId',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'transcript',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'transcriptObject',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'transcriptWithToolCalls',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'recordingUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'publicLogUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'callAnalysis',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'call_history_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'call_transcripts',
      new TableForeignKey({
        columnNames: ['call_history_id'],
        referencedTableName: 'call_history',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('call_transcripts');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('call_history_id') !== -1,
    );
    await queryRunner.dropForeignKey('call_transcripts', foreignKey);
    await queryRunner.dropTable('call_transcripts');
  }
} 