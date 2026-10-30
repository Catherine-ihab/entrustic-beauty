import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Inventory — commercial metadata.
 *
 * The inventory module shipped with clinical fields only (name, sku, unit,
 * reorder level). A real clinic also needs to know what a vial *costs* and what
 * it *sells for*, plus a display name in English for imported products.
 *
 * Added:
 *   name_en     — English / brand name shown under the Arabic name
 *   unit_cost   — purchase cost per unit, in the clinic currency
 *   sale_price  — price charged to the patient for one unit
 *   notes       — storage instructions, dilution notes, etc.
 *
 * All nullable / defaulted so existing rows are untouched.
 */
export class InventoryPricing1729000000007 implements MigrationInterface {
  name = 'InventoryPricing1729000000007';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS name_en varchar(200)`);
    await qr.query(`ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS unit_cost numeric(12,2)`);
    await qr.query(`ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS sale_price numeric(12,2)`);
    await qr.query(`ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS notes text`);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE inventory_items DROP COLUMN IF EXISTS notes`);
    await qr.query(`ALTER TABLE inventory_items DROP COLUMN IF EXISTS sale_price`);
    await qr.query(`ALTER TABLE inventory_items DROP COLUMN IF EXISTS unit_cost`);
    await qr.query(`ALTER TABLE inventory_items DROP COLUMN IF EXISTS name_en`);
  }
}
