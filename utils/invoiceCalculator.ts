import { BillData, CalculationResult } from "@/types";

export function calculateInvoice(items: BillData[]): CalculationResult {
  const subtotal = items.reduce((acc, item) => {
    if (item.amount && Number(item.amount) > 0) {
      return acc + Number(item.amount);
    }
    // Multiply by paper if needed, or fallback to 1 if paper is 0 or undefined for things that don't use paper
    const quantity = item.quantity || 1;
    const paper = item.paper || 1; 
    const rate = item.rate || 0;
    
    return acc + (quantity * paper * rate);
  }, 0);

  // GST is 18% of subtotal
  const tax = parseFloat((subtotal * 0).toFixed(2));

  const grandTotal = parseFloat((subtotal + tax).toFixed(2));

  return { subtotal, tax, grandTotal };
}