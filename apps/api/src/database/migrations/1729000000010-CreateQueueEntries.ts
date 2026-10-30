import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateQueueEntries1729000000010 implements MigrationInterface {
  name = 'CreateQueueEntries1729000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.createTable(
      new Table({
        name: 'queue_entries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'clinic_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'patient_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'patient_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'patient_phone',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'patient_number',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'service_name',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'service_category',
            type: 'varchar',
            length: '32',
            isNullable: false,
            default: "'general'",
          },
          {
            name: 'package_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'package_session_number',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'package_total_sessions',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'invoice_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'invoice_number',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'paid_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'total_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'is_paid',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'scheduled_time',
            type: 'varchar',
            length: '32',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '32',
            isNullable: false,
            default: "'waiting'",
          },
          {
            name: 'added_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'started_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'doctor_notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'practitioner',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['clinic_id'],
            referencedTableName: 'clinics',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_queue_entries_clinic_status_added_at" ON "queue_entries" ("clinic_id", "status", "added_at")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_queue_entries_clinic_id" ON "queue_entries" ("clinic_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('queue_entries');
  }
}
