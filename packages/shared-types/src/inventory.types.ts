export interface IInventoryItem {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  unit: string;
  reorderLevel: number;
  defaultVendor?: string;
  isActive: boolean;
  /** Sum of quantity_remaining across batches */
  available: number;
  batchCount: number;
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
  sku?: string;
  category?: string;
  unit?: string;
  reorderLevel?: number;
  defaultVendor?: string;
}

export interface UpdateInventoryItemDto {
  name?: string;
  sku?: string;
  category?: string;
  unit?: string;
  reorderLevel?: number;
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