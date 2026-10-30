export interface IInventoryItem {
  id: string;
  name: string;
  /** English / brand name of the product, shown as a subtitle. */
  nameEn?: string;
  sku?: string;
  category?: string;
  unit: string;
  reorderLevel: number;
  /** Purchase cost per unit (clinic currency). */
  unitCost?: number;
  /** Price charged to the patient per unit. */
  salePrice?: number;
  notes?: string;
  defaultVendor?: string;
  isActive: boolean;
  /** Sum of quantity_remaining across batches */
  available: number;
  batchCount: number;
  /** Earliest expiry date across batches that still hold stock. */
  nearestExpiry?: string;
}

export interface IInventoryBatch {
  id: string;
  itemId: string;
  itemName?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantityIn: number;
  quantityRemaining: number;
  receivedAt: string;
  notes?: string;
}

export interface CreateInventoryItemDto {
  name: string;
  nameEn?: string;
  sku?: string;
  category?: string;
  unit?: string;
  reorderLevel?: number;
  unitCost?: number;
  salePrice?: number;
  notes?: string;
  defaultVendor?: string;
}

export interface UpdateInventoryItemDto {
  name?: string;
  nameEn?: string;
  sku?: string;
  category?: string;
  unit?: string;
  reorderLevel?: number;
  unitCost?: number;
  salePrice?: number;
  notes?: string;
  defaultVendor?: string;
  isActive?: boolean;
}

export interface ReceiveBatchDto {
  batchNumber?: string;
  expiryDate?: string; // YYYY-MM-DD
  quantity: number;
  notes?: string;
}

export interface ConsumeStockDto {
  quantity: number;
  reason?: string;
  /** Session / visit id — makes the deduction idempotent on retry. */
  referenceId?: string;
}

export interface IStockAlert {
  itemId: string;
  itemName: string;
  unit: string;
  reorderLevel?: number;
  available?: number;
  batchId?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantityRemaining?: number;
}

export interface IInventoryAlerts {
  lowStock: IStockAlert[];
  expiringSoon: IStockAlert[];
  expired: IStockAlert[];
}