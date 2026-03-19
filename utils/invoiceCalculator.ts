import { BillData, CalculationResult } from "@/types";

export function calculateInvoice(items: BillData[]): CalculationResult {
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.rate, 0);

  // GST is 18% of subtotal
  const tax = parseFloat((subtotal * 0).toFixed(2));

  const grandTotal = parseFloat((subtotal + tax).toFixed(2));

  return { subtotal, tax, grandTotal };
}