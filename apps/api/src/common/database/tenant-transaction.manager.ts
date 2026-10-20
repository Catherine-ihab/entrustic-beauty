import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../middleware/tenant-resolution.middleware';

@Injectable()
export class TenantTransactionManager {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cls: ClsService,
  ) {}

  /**
   * Executes a callback within a transactional connection where PostgreSQL Row-Level Security
   * session parameter `app.current_tenant_id` is set strictly for the transaction duration.
   */
  async runWithTenant<T>(work: (qr: QueryRunner) => Promise<T>): Promise<T> {
    const tenantId = this.cls.get<string>(TENANT_ID_KEY);
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (tenantId) {
        // Set PostgreSQL transaction-local setting for RLS
        await queryRunner.query(
          `SELECT set_config('app.current_tenant_id', $1, true)`,
          [tenantId],
        );
      }

      const result = await work(queryRunner);

      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
