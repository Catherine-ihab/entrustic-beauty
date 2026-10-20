import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Inventory & Expiry Tracking tables (shared across all specialties):
 *   inventory_items      — clinic stock-keeping units (name, sku, category, reorder level)
 *   inventory_batches    — batches with expiry dates + running remaining quantity (FIFO)
 *   inventory_movements  — receive / consume / adjust audit trail (unit movements)
 *
 * All tables are tenant-scoped (clinic_id) with the same RLS pattern as the
 * rest of the platform (app.current_tenant_id).
 */
export class Inventory1729000000002 implements MigrationInterface {
  name = 'Inventory1729000000002';

  public async up(qr: QueryRunner): Promise<void> {
    // ─── INVENTORY ITEMS ────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE inventory_items (
        id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id      uuid NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
        name           varchar(200) NOT NULL,
        sku            varchar(80),
        category       varchar(80),
        unit           varchar(40) NOT NULL DEFAULT 'unit',
        reorder_level  integer NOT NULL DEFAULT 0,
        default_vendor varchar(150),
        is_active      boolean NOT NULL DEFAULT true,
        created_at     timestamptz NOT NULL DEFAULT now(),
        updated_at     timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_inventory_items_clinic_sku UNIQUE (clinic_id, sku)
      );
      CREATE INDEX idx_inventory_items_clinic ON inventory_items (clinic_id);
      CREATE INDEX idx_inventory_items_category ON inventory_items (clinic_id, category);
    `);

    // ─── INVENTORY BATCHES ──────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE inventory_batches (
        id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id          uuid NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
        item_id            uuid NOT NULL REFERENCES inventory_items (id) ON DELETE CASCADE,
        batch_number       varchar(80),
        expiry_date        date,
        quantity_in        integer NOT NULL DEFAULT 0 CHECK (quantity_in >= 0),
        quantity_remaining integer NOT NULL DEFAULT 0 CHECK (quantity_remaining >= 0),
        received_at        timestamptz NOT NULL DEFAULT now(),
        notes              text,
        created_at         timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_inventory_batches_item ON inventory_batches (clinic_id, item_id);
      CREATE INDEX idx_inventory_batches_expiry ON inventory_batches (clinic_id, expiry_date);
    `);

    // ─── INVENTORY MOVEMENTS ────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE inventory_movements (
        id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id      uuid NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
        item_id        uuid NOT NULL REFERENCES inventory_items (id) ON DELETE CASCADE,
        batch_id       uuid REFERENCES inventory_batches (id) ON DELETE SET NULL,
        movement_type  varchar(10) NOT NULL
                       CHECK (movement_type IN ('receive','consume','adjust')),
        quantity       integer NOT NULL CHECK (quantity <> 0),
        reason         text,
        created_by     uuid REFERENCES users (id) ON DELETE SET NULL,
        created_at     timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_inventory_movements_item ON inventory_movements (clinic_id, item_id);
      CREATE INDEX idx_inventory_movements_batch ON inventory_movements (batch_id);
    `);

    // ─── ROW-LEVEL SECURITY ─────────────────────────────────────────────────
    for (const table of ['inventory_items', 'inventory_batches', 'inventory_movements']) {
      await qr.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      await qr.query(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);
      await qr.query(`
        CREATE POLICY tenant_isolation ON ${table}
          USING (clinic_id::text = current_setting('app.current_tenant_id', true))
          WITH CHECK (clinic_id::text = current_setting('app.current_tenant_id', true));
      `);
    }
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS inventory_movements`);
    await qr.query(`DROP TABLE IF EXISTS inventory_batches`);
    await qr.query(`DROP TABLE IF EXISTS inventory_items`);
  }
}