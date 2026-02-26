import { app, BrowserWindow } from "electron";
import path from "path";
import { ipcMain } from "electron";
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
  const { customer, items, paymentMethod } = payload;

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

    // 2️⃣ Calculate total
    const total = items.reduce((sum: number, item: any) => {
      const quantity = Number(item.quantity) || 0;
      const paper = Number(item.paper) || 0;
      const rate = Number(item.rate) || 0;
      return sum + quantity * paper * rate;
    }, 0);

    // 3️⃣ Insert bill
    const lastBill = db
        .prepare(`SELECT bill_number FROM bills ORDER BY id DESC LIMIT 1`)
        .get() as { bill_number: string } | undefined;

      let nextNumber = 1;

      if (lastBill) {
        const lastNum = Number(lastBill.bill_number.replace("INV-", ""));
        nextNumber = lastNum + 1;
      }

      const billNumber = `INV-${String(nextNumber).padStart(5, "0")}`;
      
    const billResult = db.prepare(`
      INSERT INTO bills (customer_id, bill_number, total, created_at)
      VALUES (?, ?, ?, ?)
    `).run(
      customerId,
      billNumber,
      total,
      new Date().toISOString()
    );

    const billId = Number(billResult.lastInsertRowid);

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

    return { success: true, billNumber };
  });

  return transaction();
});

ipcMain.handle("get-bill-details", (_, billId: number) => {

  const stmt = db.prepare(`
    SELECT * FROM bills WHERE id = ?
  `);

  const bill = stmt.get(billId) as BillRow | undefined;

  if (!bill) {
    return null;
  }

  const items = db
    .prepare(`SELECT * FROM bill_items WHERE bill_id = ?`)
    .all(billId);

  const customer = db
    .prepare(`SELECT * FROM customers WHERE id = ?`)
    .get(bill.customer_id);

  return { bill, items, customer };
});

ipcMain.handle("get-bills", () => {
  const stmt = db.prepare(`
    SELECT 
      b.id,
      b.customer_id,
      b.bill_number,
      c.name AS customer_name,
      b.created_at,
      b.total,
      p.method AS payment_method
    FROM bills b
    LEFT JOIN customers c ON c.id = b.customer_id
    LEFT JOIN payments p ON p.bill_id = b.id
    ORDER BY b.created_at DESC
  `);
  
  const bills = stmt.all() as BillRow[];
  


  // Compute status based on payment method
  const billsWithStatus = bills.map(bill => {
    let status = "Pending"; // default

    if (bill.payment_method?.toLowerCase() === "cash" ||
        bill.payment_method?.toLowerCase() === "card" ||
        bill.payment_method?.toLowerCase() === "upi") {
      status = "Paid";
    }

    return {
      ...bill,
      status
    };
  });

  return billsWithStatus;
});

ipcMain.handle("get-customers", () => {
  return db
    .prepare("SELECT * FROM customers ORDER BY id DESC")
    .all();
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

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
          preload: path.join(__dirname, "preload.js"),
          contextIsolation: true,
          nodeIntegration: false,
        },
      });
      

  mainWindow.loadURL("http://localhost:3000");
}
app.whenReady().then(async () => {
    // Load DB AFTER app ready
    await import("./database");
  
    createWindow();
  });
 