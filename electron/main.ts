import { app, BrowserWindow } from "electron";
import path from "path";
import { ipcMain } from "electron";

// 🔒 Prevent multiple instances of the app
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

// Now it is safe to import the database
import { db } from "./database";

type BillRow = {
  id: number;
  customer_id: number;
  bill_number: string;
  customer_name: string;
  created_at: string;
  total: number;
  payment_method: string | null;
};

ipcMain.handle("save-bill", (_, payload) => {
  const { customer, items, paymentMethod, Total } = payload;

  if (!customer?.phone || !items?.length) {
    throw new Error("Invalid bill data");
  }

  const transaction = db.transaction(() => {

    // 1️⃣ Find or create customer
    const existingCustomer = db
      .prepare(`SELECT id FROM customers WHERE phone = ?`)
      .get(customer.phone) as { id: number } | undefined;

    let customerId: number;

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const insertCustomer = db.prepare(`
        INSERT INTO customers (name, mail, phone, ref)
        VALUES (?, ?, ?, ?)
      `);

      const result = insertCustomer.run(
        customer.name,
        customer.mail,
        customer.phone,
        customer.ref
      );

      customerId = Number(result.lastInsertRowid);
    }

    const total = Number(Total) || 0;

    // 3️⃣ Insert bill
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `INV-${year}${month}`;

    const lastBill = db
      .prepare(`SELECT bill_number FROM bills WHERE bill_number LIKE ? ORDER BY id DESC LIMIT 1`)
      .get(`${prefix}%`) as { bill_number: string } | undefined;

    let nextNumber = 1;

    if (lastBill) {
      const lastNum = Number(lastBill.bill_number.slice(-4));
      nextNumber = lastNum + 1;
    }

    const billNumber = `${prefix}${String(nextNumber).padStart(4, "0")}`;

    // Determine initial status based on payment method
    const isPaidMethod = ['cash', 'card', 'upi'].includes((paymentMethod || '').toLowerCase());
    const initialStatus = isPaidMethod ? 'Paid' : 'Pending';
    const initialPaidAmount = isPaidMethod ? total : 0;

    const billResult = db.prepare(`
      INSERT INTO bills (customer_id, bill_number, total, created_at, paid_amount, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      customerId,
      billNumber,
      total,
      new Date().toISOString(),
      initialPaidAmount,
      initialStatus
    );

    const billId = Number(billResult.lastInsertRowid);

    // Set updated_at safely (migration may have just added this column)
    try {
      db.prepare(`UPDATE bills SET updated_at = ? WHERE id = ?`)
        .run(new Date().toISOString(), billId);
    } catch (_) {
      // updated_at column may not exist in older DB versions
    }

    // 4️⃣ Insert items
    const itemStmt = db.prepare(`
      INSERT INTO bill_items
      (bill_id, service, quantity, paper, page, rate, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      itemStmt.run(
        billId,
        item.service,
        item.quantity,
        item.paper,
        item.page,
        item.rate,
        item.note
      );
    }

    // 5️⃣ Insert payment
    db.prepare(`
      INSERT INTO payments (bill_id, method, amount)
      VALUES (?, ?, ?)
    `).run(billId, paymentMethod, total);

    // 6️⃣ Insert history
    const snapshot = JSON.stringify({ customer, items, total, paymentMethod });
    db.prepare(`
      INSERT INTO bill_history (bill_id, action, snapshot, created_at)
      VALUES (?, 'CREATED', ?, ?)
    `).run(billId, snapshot, new Date().toISOString());

    // 7️⃣ Stock Reduction Logic
    try {
      const totalPapers = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0) * (Number(item.paper) || 0), 0);

      if (totalPapers > 0) {
        // Update Paper Counter
        const paperCounterRow = db.prepare("SELECT value FROM settings WHERE key = 'paper_counter'").get() as { value: string };
        let paperCount = parseInt(paperCounterRow.value) + totalPapers;
        const boxesToReduce = Math.floor(paperCount / 5000);
        paperCount = paperCount % 5000;
        db.prepare("UPDATE settings SET value = ? WHERE key = 'paper_counter'").run(paperCount.toString());

        if (boxesToReduce > 0) {
          // Find paper box product - looking for name containing 'Box' and track_stock = 1
          const boxProduct = db.prepare("SELECT id FROM products WHERE (name LIKE '%Box%' OR name LIKE '%box%') AND track_stock = 1 LIMIT 1").get() as { id: number } | undefined;
          if (boxProduct) {
            db.prepare("UPDATE products SET current_stock = current_stock - ? WHERE id = ?").run(boxesToReduce, boxProduct.id);
          }
        }

        // Update Ink Counter
        const inkCounterRow = db.prepare("SELECT value FROM settings WHERE key = 'ink_counter'").get() as { value: string };
        let inkCount = parseInt(inkCounterRow.value) + totalPapers;
        const inkToReduce = Math.floor(inkCount / 2500);
        inkCount = inkCount % 2500;
        db.prepare("UPDATE settings SET value = ? WHERE key = 'ink_counter'").run(inkCount.toString());

        if (inkToReduce > 0) {
          // Find ink bottle product - looking for name containing 'Ink' and track_stock = 1
          const inkProduct = db.prepare("SELECT id FROM products WHERE (name LIKE '%Ink%' OR name LIKE '%ink%') AND track_stock = 1 LIMIT 1").get() as { id: number } | undefined;
          if (inkProduct) {
            db.prepare("UPDATE products SET current_stock = current_stock - ? WHERE id = ?").run(inkToReduce, inkProduct.id);
          }
        }
      }
    } catch (err) {
      console.error("Stock reduction error:", err);
    }

    return { success: true, billNumber };
  });

  return transaction.immediate();
});

ipcMain.handle("get-next-bill-number", () => {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `INV-${year}${month}`;

  const lastBill = db
    .prepare(`SELECT bill_number FROM bills WHERE bill_number LIKE ? ORDER BY id DESC LIMIT 1`)
    .get(`${prefix}%`) as { bill_number: string } | undefined;

  let nextNumber = 1;
  if (lastBill) {
    const lastNum = Number(lastBill.bill_number.slice(-4));
    nextNumber = lastNum + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
});

ipcMain.handle("get-bill-details", (_, billId: number) => {

  const stmt = db.prepare(`
    SELECT * FROM bills WHERE id = ?
  `);

  const bill = stmt.get(billId) as any;

  if (!bill) {
    return null;
  }

  const items = db
    .prepare(`SELECT * FROM bill_items WHERE bill_id = ?`)
    .all(billId);

  const customer = db
    .prepare(`SELECT * FROM customers WHERE id = ?`)
    .get(bill.customer_id);
  const payment = db
    .prepare(`SELECT method FROM payments WHERE bill_id = ?`)
    .get(billId);
  const paymentHistory = db
    .prepare(`SELECT old_payment_method, new_payment_method, updated_at FROM payment_history WHERE bill_id = ? ORDER BY updated_at DESC`)
    .all(billId);

  // Fetch split payments
  const splitPayments = db
    .prepare(`SELECT * FROM split_payments WHERE bill_id = ? ORDER BY created_at ASC`)
    .all(billId) as any[];

  const totalPaid = splitPayments.reduce((sum: number, sp: any) => sum + (sp.amount || 0), 0);
  const remainingBalance = Math.max(0, bill.total - totalPaid);

  // Compute current status
  let computedStatus = 'Pending';
  if (totalPaid >= bill.total) {
    computedStatus = 'Paid';
  } else if (totalPaid > 0) {
    computedStatus = 'Partial';
  }

  return {
    bill: { ...bill, paid_amount: totalPaid, status: computedStatus },
    items,
    customer,
    paymentMethod: payment || "Pending",
    paymentHistory,
    splitPayments,
    totalPaid,
    remainingBalance
  };
});

ipcMain.handle("get-bills", (_, filters?: { paymentMethod?: string, status?: string }) => {
  let query = `
    SELECT 
      b.id,
      b.customer_id,
      b.bill_number,
      c.name AS customer_name,
      b.created_at,
      b.total,
      b.paid_amount,
      b.status,
      p.method AS payment_method
    FROM bills b
    LEFT JOIN customers c ON c.id = b.customer_id
    LEFT JOIN payments p ON p.bill_id = b.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.paymentMethod && filters.paymentMethod !== "") {
    query += ` AND LOWER(p.method) = ?`;
    params.push(filters.paymentMethod.toLowerCase());
  }

  if (filters?.status && filters.status !== "") {
    const s = filters.status.toLowerCase();
    query += ` AND LOWER(COALESCE(b.status, 'pending')) = ?`;
    params.push(s);
  }

  query += ` ORDER BY b.created_at DESC`;

  const bills = db.prepare(query).all(...params) as any[];

  // Recompute status from split_payments for accuracy
  return bills.map(bill => {
    const splitPayments = db.prepare(`SELECT SUM(amount) as total_paid FROM split_payments WHERE bill_id = ?`).get(bill.id) as any;
    const totalPaid = splitPayments?.total_paid || bill.paid_amount || 0;
    const remaining = Math.max(0, bill.total - totalPaid);

    let status = bill.status || 'Pending';
    if (totalPaid >= bill.total && bill.total > 0) {
      status = 'Paid';
    } else if (totalPaid > 0) {
      status = 'Partial';
    } else {
      // Fallback: check legacy payment method
      const m = bill.payment_method?.toLowerCase();
      if (m === 'cash' || m === 'card' || m === 'upi') {
        status = 'Paid';
      } else {
        status = 'Pending';
      }
    }
    return { ...bill, status, paid_amount: totalPaid, remaining_balance: remaining };
  });
});

// ── Bill Update API ────────────────────────────────────────────────────────

ipcMain.handle("update-bill", (_, payload) => {
  const { billId, paymentMethod } = payload;

  if (!billId || !paymentMethod) {
    throw new Error("Invalid bill update data");
  }

  const transaction = db.transaction(() => {
    const currentPayment = db.prepare(`SELECT method FROM payments WHERE bill_id = ?`).get(billId) as { method: string } | undefined;
    const oldMethod = currentPayment ? currentPayment.method : null;

    if (oldMethod !== paymentMethod) {
      if (currentPayment) {
        db.prepare(`UPDATE payments SET method = ? WHERE bill_id = ?`).run(paymentMethod, billId);
      } else {
        const bill = db.prepare(`SELECT total FROM bills WHERE id = ?`).get(billId) as { total: number } | undefined;
        db.prepare(`INSERT INTO payments (bill_id, method, amount) VALUES (?, ?, ?)`).run(billId, paymentMethod, bill?.total || 0);
      }

      db.prepare(`
        INSERT INTO payment_history (bill_id, old_payment_method, new_payment_method, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(billId, oldMethod, paymentMethod, new Date().toISOString());
    }

    // Recalculate paid_amount and status from split_payments
    const bill = db.prepare(`SELECT total FROM bills WHERE id = ?`).get(billId) as { total: number } | undefined;
    if (bill) {
      const splitResult = db.prepare(`SELECT SUM(amount) as total_paid FROM split_payments WHERE bill_id = ?`).get(billId) as any;
      const totalPaid = splitResult?.total_paid || 0;
      let status = 'Pending';
      if (totalPaid >= bill.total) {
        status = 'Paid';
      } else if (totalPaid > 0) {
        status = 'Partial';
      } else {
        // If no split payments, derive from payment method
        const isPaid = ['cash', 'card', 'upi'].includes((paymentMethod || '').toLowerCase());
        status = isPaid ? 'Paid' : 'Pending';
        // If method is paid and no split payments, set paid_amount = total
        if (isPaid) {
          db.prepare(`UPDATE bills SET paid_amount = ?, status = ? WHERE id = ?`).run(bill.total, 'Paid', billId);
          return { success: true, billId };
        }
      }
      db.prepare(`UPDATE bills SET paid_amount = ?, status = ? WHERE id = ?`).run(totalPaid, status, billId);
    }

    return { success: true, billId };
  });

  return transaction.immediate();
});

// ── Split Payments ─────────────────────────────────────────────────────────

ipcMain.handle("add-split-payment", (_, payload: { billId: number; method: string; amount: number; note?: string }) => {
  const { billId, method, amount, note } = payload;

  if (!billId || !method || !amount || amount <= 0) {
    throw new Error("Invalid split payment data");
  }

  const transaction = db.transaction(() => {
    // Insert the split payment
    const result = db.prepare(`
      INSERT INTO split_payments (bill_id, method, amount, note, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(billId, method, amount, note || null, new Date().toISOString());

    // Recalculate total paid and status
    const bill = db.prepare(`SELECT total FROM bills WHERE id = ?`).get(billId) as { total: number } | undefined;
    if (bill) {
      const splitResult = db.prepare(`SELECT SUM(amount) as total_paid FROM split_payments WHERE bill_id = ?`).get(billId) as any;
      const totalPaid = splitResult?.total_paid || 0;
      let status = 'Pending';
      if (totalPaid >= bill.total) {
        status = 'Paid';
      } else if (totalPaid > 0) {
        status = 'Partial';
      }
      db.prepare(`UPDATE bills SET paid_amount = ?, status = ? WHERE id = ?`).run(totalPaid, status, billId);

      // Also update the payments table method to reflect latest payment
      const existingPayment = db.prepare(`SELECT id FROM payments WHERE bill_id = ?`).get(billId);
      if (existingPayment) {
        db.prepare(`UPDATE payments SET method = ?, amount = ? WHERE bill_id = ?`).run(method, totalPaid, billId);
      } else {
        db.prepare(`INSERT INTO payments (bill_id, method, amount) VALUES (?, ?, ?)`).run(billId, method, totalPaid);
      }

      return { success: true, id: Number(result.lastInsertRowid), totalPaid, remainingBalance: Math.max(0, bill.total - totalPaid), status };
    }

    return { success: true, id: Number(result.lastInsertRowid) };
  });

  return transaction.immediate();
});

ipcMain.handle("get-split-payments", (_, billId: number) => {
  return db.prepare(`SELECT * FROM split_payments WHERE bill_id = ? ORDER BY created_at ASC`).all(billId);
});

ipcMain.handle("delete-split-payment", (_, { billId, paymentId }: { billId: number; paymentId: number }) => {
  const transaction = db.transaction(() => {
    db.prepare(`DELETE FROM split_payments WHERE id = ? AND bill_id = ?`).run(paymentId, billId);

    // Recalculate
    const bill = db.prepare(`SELECT total FROM bills WHERE id = ?`).get(billId) as { total: number } | undefined;
    if (bill) {
      const splitResult = db.prepare(`SELECT SUM(amount) as total_paid FROM split_payments WHERE bill_id = ?`).get(billId) as any;
      const totalPaid = splitResult?.total_paid || 0;
      let status = 'Pending';
      if (totalPaid >= bill.total) {
        status = 'Paid';
      } else if (totalPaid > 0) {
        status = 'Partial';
      }
      db.prepare(`UPDATE bills SET paid_amount = ?, status = ? WHERE id = ?`).run(totalPaid, status, billId);

      return { success: true, totalPaid, remainingBalance: Math.max(0, bill.total - totalPaid), status };
    }
    return { success: true };
  });

  return transaction.immediate();
});

// ── Bill Item Edit / Delete ────────────────────────────────────────────────

ipcMain.handle("update-bill-item", (_, item: any) => {
  const { id, service, quantity, paper, page, rate, note } = item;
  // Recalculate amount for the parent bill
  const updated = db.prepare(`
    UPDATE bill_items
    SET service = ?, quantity = ?, paper = ?, page = ?, rate = ?, note = ?
    WHERE id = ?
  `).run(service, quantity, paper, page, rate, note, id);

  // Update parent bill total
  const billRow = db.prepare(`SELECT bill_id FROM bill_items WHERE id = ?`).get(id) as { bill_id: number } | undefined;
  if (billRow) {
    const items = db.prepare(`SELECT * FROM bill_items WHERE bill_id = ?`).all(billRow.bill_id) as any[];
    const newTotal = items.reduce((s: number, i: any) => s + i.quantity * i.paper * i.rate, 0);
    db.prepare(`UPDATE bills SET total = ? WHERE id = ?`).run(newTotal, billRow.bill_id);
    db.prepare(`UPDATE payments SET amount = ? WHERE bill_id = ?`).run(newTotal, billRow.bill_id);
  }
  return { success: updated.changes > 0 };
});

ipcMain.handle("delete-bill-item", (_, itemId: number) => {
  const billRow = db.prepare(`SELECT bill_id FROM bill_items WHERE id = ?`).get(itemId) as { bill_id: number } | undefined;
  const deleted = db.prepare(`DELETE FROM bill_items WHERE id = ?`).run(itemId);
  if (billRow) {
    const items = db.prepare(`SELECT * FROM bill_items WHERE bill_id = ?`).all(billRow.bill_id) as any[];
    const newTotal = items.reduce((s: number, i: any) => s + i.quantity * i.paper * i.rate, 0);
    db.prepare(`UPDATE bills SET total = ? WHERE id = ?`).run(newTotal, billRow.bill_id);
    db.prepare(`UPDATE payments SET amount = ? WHERE bill_id = ?`).run(newTotal, billRow.bill_id);
  }
  return { success: deleted.changes > 0 };
});

// ── Payment update ─────────────────────────────────────────────────────────

ipcMain.handle("update-bill-payment", (_, { billId, method }: { billId: number; method: string }) => {
  const res = db.prepare(`UPDATE payments SET method = ? WHERE bill_id = ?`).run(method, billId);
  return { success: res.changes > 0 };
});

// ── Products CRUD ──────────────────────────────────────────────────────────

ipcMain.handle("get-products", () => {
  return db.prepare(`SELECT * FROM products ORDER BY id DESC`).all();
});

ipcMain.handle("get-product", (_, id: number) => {
  return db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
});

ipcMain.handle("add-product", (_, product: any) => {
  const { name, category, sku, description, pricingModel, costPrice, taxRate, trackStock, currentStock } = product;
  const res = db.prepare(`
    INSERT INTO products (name, category, sku, description, pricing_model, cost_price, tax_rate, track_stock, current_stock, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
  `).run(name, category, sku, description, pricingModel, costPrice, taxRate, trackStock ? 1 : 0, currentStock ?? 0);
  return { id: res.lastInsertRowid };
});

ipcMain.handle("update-product", (_, product: any) => {
  const { id, name, category, sku, description, pricingModel, costPrice, taxRate, trackStock, currentStock, status } = product;
  const res = db.prepare(`
    UPDATE products
    SET name = ?, category = ?, sku = ?, description = ?, pricing_model = ?,
        cost_price = ?, tax_rate = ?, track_stock = ?, current_stock = ?, status = ?
    WHERE id = ?
  `).run(name, category, sku, description, pricingModel, costPrice, taxRate, trackStock ? 1 : 0, currentStock ?? 0, status, id);
  return { success: res.changes > 0 };
});

ipcMain.handle("delete-product", (_, id: number) => {
  const res = db.prepare(`DELETE FROM products WHERE id = ?`).run(id);
  return { success: res.changes > 0 };
});

// ── Reports / Analytics Stats ──────────────────────────────────────────────

ipcMain.handle("get-report-stats", (_, { month, year }: { month: number; year: number }) => {
  // Month is 1-indexed
  const start = `${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`;
  const endDate = new Date(year, month, 1); // first of next month
  const end = endDate.toISOString();

  const bills = db.prepare(`
    SELECT b.id, b.total, b.created_at, b.paid_amount, b.status, p.method
    FROM bills b
    LEFT JOIN payments p ON p.bill_id = b.id
    WHERE b.created_at >= ? AND b.created_at < ?
  `).all(start, end) as Array<{ id: number; total: number; created_at: string; paid_amount: number | null; status: string | null; method: string | null }>;

  let monthlyRevenue = 0;
  let totalPrints = 0;
  let invoicesGenerated = bills.length;
  let pending = 0;

  for (const b of bills) {
    // Check split payments for this bill
    const splitResult = db.prepare(`SELECT SUM(amount) as total_paid FROM split_payments WHERE bill_id = ?`).get(b.id) as any;
    const splitPaid = splitResult?.total_paid || 0;

    if (splitPaid > 0) {
      // Has split payments - use actual paid amounts
      monthlyRevenue += splitPaid;
      pending += Math.max(0, b.total - splitPaid);
    } else {
      // Legacy: check payment method
      const isPaid = ["cash", "card", "upi"].includes((b.method || "").toLowerCase());
      if (isPaid) monthlyRevenue += b.total;
      else pending += b.total;
    }
  }

  // Count items as "prints"
  const itemsRes = db.prepare(`
    SELECT SUM(bi.quantity * bi.paper) as totalQty
    FROM bill_items bi
    INNER JOIN bills b ON b.id = bi.bill_id
    WHERE b.created_at >= ? AND b.created_at < ?
  `).get(start, end) as { totalQty: number | null };
  totalPrints = itemsRes?.totalQty ?? 0;

  const avgOrderValue = invoicesGenerated > 0 ? monthlyRevenue / invoicesGenerated : 0;

  // Previous month for comparison
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevStart = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01T00:00:00.000Z`;

  const prevBills = db.prepare(`
    SELECT b.id, b.total, p.method
    FROM bills b
    LEFT JOIN payments p ON p.bill_id = b.id
    WHERE b.created_at >= ? AND b.created_at < ?
  `).all(prevStart, start) as Array<{ id: number; total: number; method: string | null }>;

  let prevRevenue = 0;
  for (const b of prevBills) {
    const isPaid = ["cash", "card", "upi"].includes((b.method || "").toLowerCase());
    if (isPaid) prevRevenue += b.total;
  }

  const revenueChange = prevRevenue === 0 ? 100 : ((monthlyRevenue - prevRevenue) / prevRevenue) * 100;

  // Daily revenue for chart (last 7 days OR current month days)
  const dailyRevenue: { day: string; revenue: number }[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStart = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00.000Z`;
    const dayEnd = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}T23:59:59.999Z`;
    const dayBills = db.prepare(`
      SELECT b.total, p.method FROM bills b
      LEFT JOIN payments p ON p.bill_id = b.id
      WHERE b.created_at >= ? AND b.created_at <= ?
    `).all(dayStart, dayEnd) as Array<{ total: number; method: string | null }>;
    const rev = dayBills.filter(b => ["cash", "card", "upi"].includes((b.method || "").toLowerCase())).reduce((s, b) => s + b.total, 0);
    dailyRevenue.push({ day: String(d), revenue: rev });
  }

  // Service breakdown
  const serviceRows = db.prepare(`
    SELECT bi.service, SUM(bi.quantity * bi.paper * bi.rate) as total
    FROM bill_items bi
    INNER JOIN bills b ON b.id = bi.bill_id
    WHERE b.created_at >= ? AND b.created_at < ?
    GROUP BY bi.service
    ORDER BY total DESC
  `).all(start, end) as Array<{ service: string; total: number }>;

  const serviceTotal = serviceRows.reduce((s, r) => s + r.total, 0);
  const serviceBreakdown = serviceRows.map(r => ({
    name: r.service,
    total: r.total,
    pct: serviceTotal > 0 ? Math.round((r.total / serviceTotal) * 100) : 0
  }));

  // Recent transactions (last 10 in month)
  const recentTx = db.prepare(`
    SELECT b.id, b.bill_number, b.total, b.created_at, b.status, c.name AS customer_name, p.method,
           GROUP_CONCAT(bi.service || ' x' || bi.quantity, ', ') as items
    FROM bills b
    LEFT JOIN customers c ON c.id = b.customer_id
    LEFT JOIN payments p ON p.bill_id = b.id
    LEFT JOIN bill_items bi ON bi.bill_id = b.id
    WHERE b.created_at >= ? AND b.created_at < ?
    GROUP BY b.id
    ORDER BY b.created_at DESC
    LIMIT 10
  `).all(start, end) as any[];

  return {
    monthlyRevenue,
    totalPrints,
    invoicesGenerated,
    avgOrderValue,
    revenueChange,
    pendingPayments: pending,
    dailyRevenue,
    serviceBreakdown,
    recentTransactions: recentTx.map(t => ({
      ...t,
      status: t.status || (["cash", "card", "upi"].includes((t.method || "").toLowerCase()) ? "Paid" : "Pending")
    }))
  };
});

ipcMain.handle("get-customers", () => {
  const stmt = db.prepare(`
    SELECT
      c.id,
      c.name,
      c.phone,
      c.mail,
      c.ref,

      COALESCE(SUM(b.total), 0) AS totalSpent,
      MAX(b.created_at) AS lastVisit,
      COALESCE((
        SELECT SUM(MAX(0, b2.total - COALESCE(b2.paid_amount, 0)))
        FROM bills b2
        WHERE b2.customer_id = c.id
      ), 0) AS pending

    FROM customers c
    LEFT JOIN bills b ON b.customer_id = c.id
    GROUP BY c.id
    ORDER BY c.id DESC
  `);

  return stmt.all();
});

ipcMain.handle("add-customer", (_, customer) => {
  const existing = db
    .prepare("SELECT id FROM customers WHERE phone = ?")
    .get(customer.phone);

  if (existing) {
    throw new Error("Customer already exists with this phone");
  }

  const stmt = db.prepare(`
    INSERT INTO customers (name, mail, phone, ref)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(
    customer.name,
    customer.mail,
    customer.phone,
    customer.ref
  );

  return { id: result.lastInsertRowid };
});

import { spawn } from "child_process";
import net from "net";
import fs from "fs";
import os from "os";

let server: any;

// ⏳ Poll TCP until the server is actually listening, then run callback
function waitForPort(
  port: number,
  host: string,
  onReady: () => void,
  onFail: () => void,
  maxAttempts = 40,
  intervalMs = 500
): void {
  let attempts = 0;
  const tryConnect = () => {
    const client = new net.Socket();
    client.setTimeout(300);
    client
      .connect(port, host, () => {
        client.destroy();
        onReady();
      })
      .on("error", () => {
        client.destroy();
        attempts++;
        if (attempts >= maxAttempts) {
          onFail();
        } else {
          setTimeout(tryConnect, intervalMs);
        }
      })
      .on("timeout", () => {
        client.destroy();
        attempts++;
        if (attempts >= maxAttempts) {
          onFail();
        } else {
          setTimeout(tryConnect, intervalMs);
        }
      });
  };
  tryConnect();
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.setMenuBarVisibility(false);
  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    // Show a simple loading page while the server starts
    mainWindow.loadURL(
      "data:text/html,<html><body style='background:#0f172a;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;color:#94a3b8;font-size:18px;'>Starting TamilPrinter...</body></html>"
    );

    // 🚀 Start Next.js standalone server
    // With asar:false, all app files live at resources/app/
    const standaloneServer = path.join(
      process.resourcesPath,
      "app",
      ".next",
      "standalone",
      "server.js"
    );

    const logFile = path.join(os.tmpdir(), "tamilprinter-server.log");
    const logStream = fs.createWriteStream(logFile, { flags: "a" });
    logStream.write(`\n--- App started at ${new Date().toISOString()} ---\n`);
    logStream.write(`Server path: ${standaloneServer}\n`);
    logStream.write(`Server exists: ${fs.existsSync(standaloneServer)}\n`);

    server = spawn(process.execPath, [standaloneServer], {
      env: {
        ...process.env,
        PORT: "3000",
        HOSTNAME: "127.0.0.1",
        NODE_ENV: "production",
        // 🔑 CRITICAL: tells Electron binary to run as plain Node.js
        ELECTRON_RUN_AS_NODE: "1",
      },
      stdio: "pipe",
    });

    server.stdout?.on("data", (data: Buffer) => {
      logStream.write("[stdout] " + data.toString());
    });
    server.stderr?.on("data", (data: Buffer) => {
      logStream.write("[stderr] " + data.toString());
    });
    server.on("close", (code: number) => {
      logStream.write(`[server exited] code=${code}\n`);
    });
    server.on("error", (err: Error) => {
      logStream.write(`[spawn error] ${err.message}\n`);
    });

    // ⏳ Poll until port 3000 is listening, then load the app
    waitForPort(
      3000,
      "127.0.0.1",
      () => {
        logStream.write("Server is ready — loading URL\n");
        mainWindow.loadURL("http://127.0.0.1:3000");
      },
      () => {
        logStream.write("Server failed to start after max retries\n");
        mainWindow.loadURL(
          `data:text/html,<html><body style='background:#0f172a;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;color:#f87171;font-size:16px;gap:12px;'>
            <div style='font-size:24px'>⚠️ Server failed to start</div>
            <div style='color:#94a3b8'>Check log: ${logFile.replace(/\\/g, "\\\\")}</div>
          </body></html>`
        );
      }
    );
  }
}
app.whenReady().then(async () => {
  createWindow();
});
app.on("will-quit", () => {
  if (server) server.kill();
});