import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TenantTransactionManager } from '../../common/database/tenant-transaction.manager';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryBatch } from './entities/inventory-batch.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import {
  IInventoryItem,
  IInventoryBatch,
  IInventoryAlerts,
  IStockAlert,
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  ReceiveBatchDto,
} from '@clinic/shared-types';

const EXPIRY_ALERT_DAYS = 90;

interface ItemRow {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string;
  reorder_level: number;
  default_vendor: string | null;
  is_active: boolean;
  available: number;
  batch_count: number;
}

function toItemDto(r: ItemRow): IInventoryItem {
  return {
    id: r.id,
    name: r.name,
    sku: r.sku ?? undefined,
    category: r.category ?? undefined,
    unit: r.unit,
    reorderLevel: r.reorder_level,
    defaultVendor: r.default_vendor ?? undefined,
    isActive: r.is_active,
    available: r.available,
    batchCount: r.batch_count,
  };
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,
    @InjectRepository(InventoryBatch)
    private readonly batchRepo: Repository<InventoryBatch>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepo: Repository<InventoryMovement>,
    private readonly dataSource: DataSource,
    private readonly tenantTx: TenantTransactionManager,
  ) {}

  private readonly itemSelect = `
    SELECT i.id, i.name, i.sku, i.category, i.unit, i.reorder_level,
           i.default_vendor, i.is_active,
           COALESCE(SUM(b.quantity_remaining), 0)::int AS available,
           COUNT(b.id)::int AS batch_count
    FROM inventory_items i
    LEFT JOIN inventory_batches b
      ON b.item_id = i.id AND b.clinic_id = i.clinic_id
    WHERE i.clinic_id = $1
  `;

  async findAll(clinicId: string, q?: string, category?: string): Promise<IInventoryItem[]> {
    let sql = this.itemSelect;
    const params: Array<string | number> = [clinicId];
    if (category && category.trim()) {
      sql += ` AND i.category = $${params.length + 1}`;
      params.push(category.trim());
    }
    if (q && q.trim()) {
      sql += ` AND (i.name ILIKE $${params.length + 1} OR COALESCE(i.sku,'') ILIKE $${params.length + 1})`;
      params.push(`%${q.trim()}%`);
    }
    sql += ` GROUP BY i.id ORDER BY i.name ASC`;
    const rows = await this.dataSource.query(sql, params);
    return rows.map(toItemDto);
  }

  async findOne(clinicId: string, id: string): Promise<{ item: IInventoryItem; batches: IInventoryBatch[] }> {
    const [row] = await this.dataSource.query(
      `${this.itemSelect} AND i.id = $2 GROUP BY i.id`,
      [clinicId, id],
    );
    if (!row) {
      throw new NotFoundException('Inventory item not found');
    }
    const batches = await this.batchRepo.find({
      where: { clinic_id: clinicId, item_id: id },
      order: { expiry_date: 'ASC', received_at: 'ASC' },
    });
    return {
      item: toItemDto(row),
      batches: batches.map((b) => ({
        id: b.id,
        itemId: b.item_id,
        batchNumber: b.batch_number ?? undefined,
        expiryDate: b.expiry_date ?? undefined,
        quantityIn: b.quantity_in,
        quantityRemaining: b.quantity_remaining,
        receivedAt: b.received_at.toISOString(),
        notes: b.notes ?? undefined,
      })),
    };
  }

  async create(clinicId: string, dto: CreateInventoryItemDto): Promise<IInventoryItem> {
    if (!dto.name?.trim()) {
      throw new BadRequestException('Item name is required');
    }
    const item = this.itemRepo.create({
      clinic_id: clinicId,
      name: dto.name.trim(),
      sku: dto.sku?.trim() || null,
      category: dto.category?.trim() || null,
      unit: dto.unit?.trim() || 'unit',
      reorder_level: Math.max(0, dto.reorderLevel ?? 0),
      default_vendor: dto.defaultVendor?.trim() || null,
      is_active: true,
    });
    const saved = await this.itemRepo.save(item);
    return toItemDto({
      id: saved.id,
      name: saved.name,
      sku: saved.sku,
      category: saved.category,
      unit: saved.unit,
      reorder_level: saved.reorder_level,
      default_vendor: saved.default_vendor,
      is_active: saved.is_active,
      available: 0,
      batch_count: 0,
    });
  }

  async update(clinicId: string, id: string, dto: UpdateInventoryItemDto): Promise<IInventoryItem> {
    const [row] = await this.dataSource.query(
      `SELECT i.id FROM inventory_items i WHERE i.clinic_id = $1 AND i.id = $2`,
      [clinicId, id],
    );
    if (!row) {
      throw new NotFoundException('Inventory item not found');
    }
    const item = await this.itemRepo.findOne({ where: { id, clinic_id: clinicId } });
    if (!item) throw new NotFoundException('Inventory item not found');

    if (dto.name !== undefined) item.name = dto.name.trim();
    if (dto.sku !== undefined) item.sku = dto.sku.trim() || null;
    if (dto.category !== undefined) item.category = dto.category.trim() || null;
    if (dto.unit !== undefined) item.unit = dto.unit.trim() || 'unit';
    if (dto.reorderLevel !== undefined) item.reorder_level = Math.max(0, dto.reorderLevel);
    if (dto.defaultVendor !== undefined) item.default_vendor = dto.defaultVendor.trim() || null;
    if (dto.isActive !== undefined) item.is_active = dto.isActive;

    const saved = await this.itemRepo.save(item);

    const total = await this.dataSource.query(
      `SELECT COALESCE(SUM(b.quantity_remaining), 0)::int AS available, COUNT(b.id)::int AS batch_count
       FROM inventory_batches b WHERE b.clinic_id = $1 AND b.item_id = $2`,
      [clinicId, id],
    );
    const r = total[0] ?? { available: 0, batch_count: 0 };
    return toItemDto({
      id: saved.id,
      name: saved.name,
      sku: saved.sku,
      category: saved.category,
      unit: saved.unit,
      reorder_level: saved.reorder_level,
      default_vendor: saved.default_vendor,
      is_active: saved.is_active,
      available: r.available,
      batch_count: r.batch_count,
    });
  }

  /** Receive a new (or existing) batch into stock — writes batch + movement atomically. */
  async receiveStock(
    clinicId: string,
    itemId: string,
    dto: ReceiveBatchDto,
    createdBy: string | null,
  ): Promise<IInventoryBatch> {
    if (!dto.quantity || dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be a positive number');
    }
    return this.tenantTx.runWithTenant(async (qr) => {
      const [item] = await qr.query(
        `SELECT id FROM inventory_items WHERE clinic_id = $1 AND id = $2 AND is_active = true`,
        [clinicId, itemId],
      );
      if (!item) {
        throw new BadRequestException('Inventory item not found or inactive');
      }

      const [batch] = await qr.query(
        `INSERT INTO inventory_batches
           (id, clinic_id, item_id, batch_number, expiry_date, quantity_in, quantity_remaining, received_at, notes)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $5, now(), $6)
         RETURNING id, batch_number, expiry_date, quantity_in, quantity_remaining, received_at, notes`,
        [clinicId, itemId, dto.batchNumber?.trim() || null, dto.expiryDate || null, dto.quantity, dto.notes?.trim() || null],
      );

      await qr.query(
        `INSERT INTO inventory_movements
           (id, clinic_id, item_id, batch_id, movement_type, quantity, reason, created_by)
         VALUES (uuid_generate_v4(), $1, $2, $3, 'receive', $4, $5, $6)`,
        [clinicId, itemId, batch.id, dto.quantity, dto.notes?.trim() || 'Stock received', createdBy],
      );

      return {
        id: batch.id,
        itemId,
        batchNumber: batch.batch_number ?? undefined,
        expiryDate: batch.expiry_date ?? undefined,
        quantityIn: batch.quantity_in,
        quantityRemaining: batch.quantity_remaining,
        receivedAt: batch.received_at.toISOString(),
        notes: batch.notes ?? undefined,
      };
    });
  }

  /**
   * Consume stock FIFO-style across non-expired batches (earliest expiry first).
   * Writes per-batch decrements + movements atomically inside one transaction.
   */
  async consumeStock(
    clinicId: string,
    itemId: string,
    quantity: number,
    reason: string | null,
    createdBy: string | null,
  ): Promise<{ consumed: number; batches: Array<{ batchId: string; quantity: number }> }> {
    if (!quantity || quantity <= 0) {
      throw new BadRequestException('Quantity must be a positive number');
    }
    return this.tenantTx.runWithTenant(async (qr) => {
      const [item] = await qr.query(
        `SELECT id FROM inventory_items WHERE clinic_id = $1 AND id = $2`,
        [clinicId, itemId],
      );
      if (!item) {
        throw new BadRequestException('Inventory item not found');
      }

      // FIFO candidates: skip expired batches; order by earliest expiry first.
      const candidates = await qr.query(
        `SELECT id, quantity_remaining, expiry_date
         FROM inventory_batches
         WHERE clinic_id = $1 AND item_id = $2 AND quantity_remaining > 0
           AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
         ORDER BY expiry_date ASC NULLS LAST, received_at ASC, created_at ASC
         FOR UPDATE`,
        [clinicId, itemId],
      );

      const totalAvailable = candidates.reduce((s: number, c: any) => s + c.quantity_remaining, 0);
      if (totalAvailable < quantity) {
        throw new BadRequestException(
          `Insufficient non-expired stock: ${totalAvailable} available, ${quantity} requested`,
        );
      }

      const movements: Array<{ batchId: string; quantity: number }> = [];
      let remaining = quantity;

      for (const batch of candidates) {
        if (remaining <= 0) break;
        const take = Math.min(batch.quantity_remaining, remaining);
        await qr.query(
          `UPDATE inventory_batches SET quantity_remaining = quantity_remaining - $1
           WHERE id = $2`,
          [take, batch.id],
        );
        await qr.query(
          `INSERT INTO inventory_movements
             (id, clinic_id, item_id, batch_id, movement_type, quantity, reason, created_by)
           VALUES (uuid_generate_v4(), $1, $2, $3, 'consume', $4, $5, $6)`,
          [clinicId, itemId, batch.id, -take, reason?.trim() || 'Consumed', createdBy],
        );
        movements.push({ batchId: batch.id, quantity: take });
        remaining -= take;
      }

      return { consumed: quantity, batches: movements };
    });
  }

  /** Low stock, expiring soon and already-expired batches at a glance. */
  async getAlerts(clinicId: string): Promise<IInventoryAlerts> {
    const lowStockRows = await this.dataSource.query(
      `SELECT i.id AS "itemId", i.name AS "itemName", i.unit, i.reorder_level AS "reorderLevel",
              COALESCE(SUM(b.quantity_remaining), 0)::int AS available
       FROM inventory_items i
       LEFT JOIN inventory_batches b ON b.item_id = i.id AND b.clinic_id = i.clinic_id
       WHERE i.clinic_id = $1 AND i.is_active = true
       GROUP BY i.id
       HAVING COALESCE(SUM(b.quantity_remaining), 0) <= i.reorder_level
       ORDER BY available ASC`,
      [clinicId],
    );

    const expiringRows = await this.dataSource.query(
      `SELECT b.id AS "batchId", b.batch_number AS "batchNumber", b.expiry_date AS "expiryDate",
              b.quantity_remaining AS "quantityRemaining",
              i.id AS "itemId", i.name AS "itemName", i.unit
       FROM inventory_batches b
       JOIN inventory_items i ON i.id = b.item_id AND i.clinic_id = b.clinic_id
       WHERE b.clinic_id = $1 AND b.quantity_remaining > 0
         AND b.expiry_date IS NOT NULL
         AND b.expiry_date >= CURRENT_DATE
         AND b.expiry_date <= CURRENT_DATE + $2::int
       ORDER BY b.expiry_date ASC`,
      [clinicId, EXPIRY_ALERT_DAYS],
    );

    const expiredRows = await this.dataSource.query(
      `SELECT b.id AS "batchId", b.batch_number AS "batchNumber", b.expiry_date AS "expiryDate",
              b.quantity_remaining AS "quantityRemaining",
              i.id AS "itemId", i.name AS "itemName", i.unit
       FROM inventory_batches b
       JOIN inventory_items i ON i.id = b.item_id AND i.clinic_id = b.clinic_id
       WHERE b.clinic_id = $1 AND b.quantity_remaining > 0
         AND b.expiry_date IS NOT NULL AND b.expiry_date < CURRENT_DATE
       ORDER BY b.expiry_date ASC`,
      [clinicId],
    );

    return {
      lowStock: lowStockRows as IStockAlert[],
      expiringSoon: expiringRows as IStockAlert[],
      expired: expiredRows as IStockAlert[],
    };
  }
}