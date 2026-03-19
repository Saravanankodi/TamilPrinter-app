import { Invoice } from "@/types";

export function calculateDashboardStats(invoices: Invoice[]) {
  const today = new Date();

  const isToday = (date: Date) =>
    date.toDateString() === today.toDateString();

  const isThisMonth = (date: Date) =>
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  let todaysRevenue = 0;
  let yesterdayRevenue = 0;
  let monthlySales = 0;
  let pendingPayments = 0;
  let invoicesGenerated = 0;

  invoices.forEach((inv) => {
    const date = new Date(inv.created_at);

    // Today revenue
    if (isToday(date) && inv.status === 'Paid') {
      todaysRevenue += inv.total;
    }

    // Yesterday revenue
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (
      date.toDateString() === yesterday.toDateString() &&
      inv.status === 'Paid'
    ) {
      yesterdayRevenue += inv.total;
    }

    // Monthly sales
    if (isThisMonth(date) && inv.status === 'Paid') {
      monthlySales += inv.total;
    }

    // Pending
    if (inv.status === 'Pending') {
      pendingPayments += inv.total;
    }

    // Count invoices
    if (isToday(date)) {
      invoicesGenerated++;
    }
  });

  const percentChange =
    yesterdayRevenue === 0
      ? 100
      : ((todaysRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;

  return {
    todaysRevenue,
    invoicesGenerated,
    monthlySales,
    pendingPayments,
    percentChange,
  };
}