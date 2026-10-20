/**
 * Phase A7 — Cashier & Cashflow (shared across all specialties):
 *   drawer shift management with blind closure + reconciliation,
 *   split payment lines against invoices, petty-cash expenses,
 *   and the daily cashflow summary behind the cashier screen.
 */

export type CashierShiftStatus = 'open' | 'closed';

/** A drawer shift: opened with float cash, closed blind (counted first, expected revealed after). */
export interface CashierShift {
  id: string;
  clinic_id: string;
  opened_by: string | null;
  opened_at: string | Date;
  float_cash: number;
  status: CashierShiftStatus;
  closed_by: string | null;
  closed_at: string | Date | null;
  counted_cash: number | null;
  expected_cash: number | null;
  variance: number | null;
  notes: string | null;
  created_at: string | Date;
}

/** One payment line on an invoice — invoices are paid by one or more of these (split payment). */
export interface Payment {
  id: string;
  clinic_id: string;
  invoice_id: string;
  shift_id: string | null;
  amount: number;
  method: string; // PaymentMethod value
  reference: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string | Date;
}

export interface Expense {
  id: string;
  clinic_id: string;
  shift_id: string | null;
  category: string;
  amount: number;
  description: string;
  receipt_photo: string | null;
  expense_date: string; // YYYY-MM-DD
  created_by: string | null;
  created_at: string | Date;
}

export interface OpenShiftDto {
  float_cash: number;
}

export interface CloseShiftDto {
  counted_cash: number;
  notes?: string;
}

export interface CreateExpenseDto {
  category: string;
  amount: number;
  description: string;
  receipt_photo?: string;
  expense_date?: string; // YYYY-MM-DD — defaults to today
}

export interface AmountByMethod {
  method: string;
  amount: number;
  count: number;
}

export interface AmountByCategory {
  category: string;
  amount: number;
  count: number;
}

/** Reconciliation report for a CLOSED shift — deficit/surplus against the program's expected cash. */
export interface CashierShiftReconciliation {
  shift: CashierShift;
  paymentsByMethod: AmountByMethod[];
  expensesByCategory: AmountByCategory[];
  totalCashIn: number;
  totalExpenses: number;
  expectedCash: number;
  variance: number;
}

/** Blind-closure result: what the cashier submitted vs what the drawer should hold. */
export interface CloseShiftResult {
  shift: CashierShift;
  reconciliation: CashierShiftReconciliation;
}

/** Daily Summary Report — sales, receipts by method, expenses and net cash for one date. */
export interface CashierDailySummary {
  date: string;
  sales: {
    count: number;
    total: number;
    collected: number;
  };
  collectedByMethod: AmountByMethod[];
  collectedTotal: number;
  expensesByCategory: AmountByCategory[];
  expensesTotal: number;
  /** Cash-method receipts minus expenses paid from the drawer. */
  netCash: number;
  openShift: {
    id: string;
    float_cash: number;
    opened_at: string;
  } | null;
}
