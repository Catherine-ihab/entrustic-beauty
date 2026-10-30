import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Inventory — movement references.
 *
 * Clinical workspaces deduct consumables as a side effect of finishing a
 * session ("this laser session used one tube of soothing cream"). If that
 * request is retried — double click, flaky network, page reload — the stock
 * used to be deducted twice.
 *
 * `reference_id` records the session/visit that caused the movement, so
 * consumeStock() can recognise a replay and answer with the original result
 * instead of writing a second deduction.
 */
export class InventoryMovementReference1729000000008 implements MigrationInterface {
  name = 'InventoryMovementReference1729000000008';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS reference_id varchar(120)`);
    await qr.query(`
      CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference
        ON inventory_movements (clinic_id, item_id, reference_id)
        WHERE reference_id IS NOT NULL
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS idx_inventory_movements_reference`);
    await qr.query(`ALTER TABLE inventory_movements DROP COLUMN IF EXISTS reference_id`);
  }
}
