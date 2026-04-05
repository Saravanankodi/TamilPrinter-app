"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const electron_2 = require("electron");
// 🔒 Prevent multiple instances of the app
const gotLock = electron_1.app.requestSingleInstanceLock();
if (!gotLock) {
    electron_1.app.quit();
    process.exit(0);
}
// Now it is safe to import the database
const database_1 = require("./database");
electron_2.ipcMain.handle("save-bill", (_, payload) => {
    const { customer, items, paymentMethod } = payload;
    if (!customer?.phone || !items?.length) {
        throw new Error("Invalid bill data");
    }
    const transaction = database_1.db.transaction(() => {
        // 1️⃣ Find or create customer
        const existingCustomer = database_1.db
            .prepare(`SELECT id FROM customers WHERE phone = ?`)
            .get(customer.phone);
        let customerId;
        if (existingCustomer) {
            customerId = existingCustomer.id;
        }
        else {
            const insertCustomer = database_1.db.prepare(`
        INSERT INTO customers (name, mail, phone, ref)
        VALUES (?, ?, ?, ?)
      `);
            const result = insertCustomer.run(customer.name, customer.mail, customer.phone, customer.ref);
            customerId = Number(result.lastInsertRowid);
        }
        // 2️⃣ Calculate total
        const total = items.reduce((sum, item) => {
            const quantity = Number(item.quantity) || 0;
            const paper = Number(item.paper) || 0;
            const rate = Number(item.rate) || 0;
            return sum + quantity * paper * rate;
        }, 0);
        // 3️⃣ Insert bill
        const now = new Date();
        const year = String(now.getFullYear()).slice(-2);
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const prefix = `INV-${year}${month}`;
        const lastBill = database_1.db
            .prepare(`SELECT bill_number FROM bills WHERE bill_number LIKE ? ORDER BY id DESC LIMIT 1`)
            .get(`${prefix}%`);
        let nextNumber = 1;
        if (lastBill) {
            const lastNum = Number(lastBill.bill_number.slice(-4));
            nextNumber = lastNum + 1;
        }
        const billNumber = `${prefix}${String(nextNumber).padStart(4, "0")}`;
        const billResult = database_1.db.prepare(`
      INSERT INTO bills (customer_id, bill_number, total, created_at)
      VALUES (?, ?, ?, ?)
    `).run(customerId, billNumber, total, new Date().toISOString());
        const billId = Number(billResult.lastInsertRowid);
        // Set updated_at safely (migration may have just added this column)
        try {
            database_1.db.prepare(`UPDATE bills SET updated_at = ? WHERE id = ?`)
                .run(new Date().toISOString(), billId);
        }
        catch (_) {
            // updated_at column may not exist in older DB versions
        }
        // 4️⃣ Insert items
        const itemStmt = database_1.db.prepare(`
      INSERT INTO bill_items
      (bill_id, service, quantity, paper, page, rate, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        for (const item of items) {
            itemStmt.run(billId, item.service, item.quantity, item.paper, item.page, item.rate, item.note);
        }
        // 5️⃣ Insert payment
        database_1.db.prepare(`
      INSERT INTO payments (bill_id, method, amount)
      VALUES (?, ?, ?)
    `).run(billId, paymentMethod, total);
        // 6️⃣ Insert history
        const snapshot = JSON.stringify({ customer, items, total, paymentMethod });
        database_1.db.prepare(`
      INSERT INTO bill_history (bill_id, action, snapshot, created_at)
      VALUES (?, 'CREATED', ?, ?)
    `).run(billId, snapshot, new Date().toISOString());
        return { success: true, billNumber };
    });
    return transaction.immediate();
});
electron_2.ipcMain.handle("get-next-bill-number", () => {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `INV-${year}${month}`;
    const lastBill = database_1.db
        .prepare(`SELECT bill_number FROM bills WHERE bill_number LIKE ? ORDER BY id DESC LIMIT 1`)
        .get(`${prefix}%`);
    let nextNumber = 1;
    if (lastBill) {
        const lastNum = Number(lastBill.bill_number.slice(-4));
        nextNumber = lastNum + 1;
    }
    return `${prefix}${String(nextNumber).padStart(4, "0")}`;
});
electron_2.ipcMain.handle("get-bill-details", (_, billId) => {
    const stmt = database_1.db.prepare(`
    SELECT * FROM bills WHERE id = ?
  `);
    const bill = stmt.get(billId);
    if (!bill) {
        return null;
    }
    const items = database_1.db
        .prepare(`SELECT * FROM bill_items WHERE bill_id = ?`)
        .all(billId);
    const customer = database_1.db
        .prepare(`SELECT * FROM customers WHERE id = ?`)
        .get(bill.customer_id);
    const payment = database_1.db
        .prepare(`SELECT method FROM payments WHERE bill_id = ?`)
        .get(billId);
    return { bill, items, customer, paymentMethod: payment || "Pending" };
});
electron_2.ipcMain.handle("get-bills", (_, filters) => {
    let query = `
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
    WHERE 1=1
  `;
    const params = [];
    if (filters?.paymentMethod && filters.paymentMethod !== "") {
        query += ` AND LOWER(p.method) = ?`;
        params.push(filters.paymentMethod.toLowerCase());
    }
    if (filters?.status && filters.status !== "") {
        const s = filters.status.toLowerCase();
        if (s === 'paid') {
            query += ` AND LOWER(p.method) IN ('cash', 'card', 'upi')`;
        }
        else if (s === 'pending') {
            query += ` AND (p.method IS NULL OR LOWER(p.method) NOT IN ('cash', 'card', 'upi'))`;
        }
    }
    query += ` ORDER BY b.created_at DESC`;
    const bills = database_1.db.prepare(query).all(...params);
    // Computer status for UI
    return bills.map(bill => {
        let status = "Pending";
        const m = bill.payment_method?.toLowerCase();
        if (m === "cash" || m === "card" || m === "upi") {
            status = "Paid";
        }
        return { ...bill, status };
    });
});
// ── Bill Update API ────────────────────────────────────────────────────────
electron_2.ipcMain.handle("update-bill", (_, payload) => {
    const { billId, paymentMethod } = payload;
    if (!billId || !paymentMethod) {
        throw new Error("Invalid bill update data");
    }
    const transaction = database_1.db.transaction(() => {
        const currentPayment = database_1.db.prepare(`SELECT method FROM payments WHERE bill_id = ?`).get(billId);
        const oldMethod = currentPayment ? currentPayment.method : null;
        if (oldMethod !== paymentMethod) {
            if (currentPayment) {
                database_1.db.prepare(`UPDATE payments SET method = ? WHERE bill_id = ?`).run(paymentMethod, billId);
            }
            else {
                const bill = database_1.db.prepare(`SELECT total FROM bills WHERE id = ?`).get(billId);
                database_1.db.prepare(`INSERT INTO payments (bill_id, method, amount) VALUES (?, ?, ?)`).run(billId, paymentMethod, bill?.total || 0);
            }
            database_1.db.prepare(`
        INSERT INTO payment_history (bill_id, old_payment_method, new_payment_method, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(billId, oldMethod, paymentMethod, new Date().toISOString());
        }
        return { success: true, billId };
    });
    return transaction.immediate();
});
// ── Bill Item Edit / Delete ────────────────────────────────────────────────
electron_2.ipcMain.handle("update-bill-item", (_, item) => {
    const { id, service, quantity, paper, page, rate, note } = item;
    // Recalculate amount for the parent bill
    const updated = database_1.db.prepare(`
    UPDATE bill_items
    SET service = ?, quantity = ?, paper = ?, page = ?, rate = ?, note = ?
    WHERE id = ?
  `).run(service, quantity, paper, page, rate, note, id);
    // Update parent bill total
    const billRow = database_1.db.prepare(`SELECT bill_id FROM bill_items WHERE id = ?`).get(id);
    if (billRow) {
        const items = database_1.db.prepare(`SELECT * FROM bill_items WHERE bill_id = ?`).all(billRow.bill_id);
        const newTotal = items.reduce((s, i) => s + i.quantity * i.paper * i.rate, 0);
        database_1.db.prepare(`UPDATE bills SET total = ? WHERE id = ?`).run(newTotal, billRow.bill_id);
        database_1.db.prepare(`UPDATE payments SET amount = ? WHERE bill_id = ?`).run(newTotal, billRow.bill_id);
    }
    return { success: updated.changes > 0 };
});
electron_2.ipcMain.handle("delete-bill-item", (_, itemId) => {
    const billRow = database_1.db.prepare(`SELECT bill_id FROM bill_items WHERE id = ?`).get(itemId);
    const deleted = database_1.db.prepare(`DELETE FROM bill_items WHERE id = ?`).run(itemId);
    if (billRow) {
        const items = database_1.db.prepare(`SELECT * FROM bill_items WHERE bill_id = ?`).all(billRow.bill_id);
        const newTotal = items.reduce((s, i) => s + i.quantity * i.paper * i.rate, 0);
        database_1.db.prepare(`UPDATE bills SET total = ? WHERE id = ?`).run(newTotal, billRow.bill_id);
        database_1.db.prepare(`UPDATE payments SET amount = ? WHERE bill_id = ?`).run(newTotal, billRow.bill_id);
    }
    return { success: deleted.changes > 0 };
});
// ── Payment update ─────────────────────────────────────────────────────────
electron_2.ipcMain.handle("update-bill-payment", (_, { billId, method }) => {
    const res = database_1.db.prepare(`UPDATE payments SET method = ? WHERE bill_id = ?`).run(method, billId);
    return { success: res.changes > 0 };
});
// ── Products CRUD ──────────────────────────────────────────────────────────
electron_2.ipcMain.handle("get-products", () => {
    return database_1.db.prepare(`SELECT * FROM products ORDER BY id DESC`).all();
});
electron_2.ipcMain.handle("get-product", (_, id) => {
    return database_1.db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
});
electron_2.ipcMain.handle("add-product", (_, product) => {
    const { name, category, sku, description, pricingModel, costPrice, taxRate, trackStock, currentStock } = product;
    const res = database_1.db.prepare(`
    INSERT INTO products (name, category, sku, description, pricing_model, cost_price, tax_rate, track_stock, current_stock, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
  `).run(name, category, sku, description, pricingModel, costPrice, taxRate, trackStock ? 1 : 0, currentStock ?? 0);
    return { id: res.lastInsertRowid };
});
electron_2.ipcMain.handle("update-product", (_, product) => {
    const { id, name, category, sku, description, pricingModel, costPrice, taxRate, trackStock, currentStock, status } = product;
    const res = database_1.db.prepare(`
    UPDATE products
    SET name = ?, category = ?, sku = ?, description = ?, pricing_model = ?,
        cost_price = ?, tax_rate = ?, track_stock = ?, current_stock = ?, status = ?
    WHERE id = ?
  `).run(name, category, sku, description, pricingModel, costPrice, taxRate, trackStock ? 1 : 0, currentStock ?? 0, status, id);
    return { success: res.changes > 0 };
});
electron_2.ipcMain.handle("delete-product", (_, id) => {
    const res = database_1.db.prepare(`DELETE FROM products WHERE id = ?`).run(id);
    return { success: res.changes > 0 };
});
// ── Reports / Analytics Stats ──────────────────────────────────────────────
electron_2.ipcMain.handle("get-report-stats", (_, { month, year }) => {
    // Month is 1-indexed
    const start = `${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`;
    const endDate = new Date(year, month, 1); // first of next month
    const end = endDate.toISOString();
    const bills = database_1.db.prepare(`
    SELECT b.id, b.total, b.created_at, p.method
    FROM bills b
    LEFT JOIN payments p ON p.bill_id = b.id
    WHERE b.created_at >= ? AND b.created_at < ?
  `).all(start, end);
    let monthlyRevenue = 0;
    let totalPrints = 0;
    let invoicesGenerated = bills.length;
    let pending = 0;
    for (const b of bills) {
        const isPaid = ["cash", "card", "upi"].includes((b.method || "").toLowerCase());
        if (isPaid)
            monthlyRevenue += b.total;
        else
            pending += b.total;
    }
    // Count items as "prints"
    const itemsRes = database_1.db.prepare(`
    SELECT SUM(bi.quantity * bi.paper) as totalQty
    FROM bill_items bi
    INNER JOIN bills b ON b.id = bi.bill_id
    WHERE b.created_at >= ? AND b.created_at < ?
  `).get(start, end);
    totalPrints = itemsRes?.totalQty ?? 0;
    const avgOrderValue = invoicesGenerated > 0 ? monthlyRevenue / invoicesGenerated : 0;
    // Previous month for comparison
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStart = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01T00:00:00.000Z`;
    const prevBills = database_1.db.prepare(`
    SELECT b.id, b.total, p.method
    FROM bills b
    LEFT JOIN payments p ON p.bill_id = b.id
    WHERE b.created_at >= ? AND b.created_at < ?
  `).all(prevStart, start);
    let prevRevenue = 0;
    for (const b of prevBills) {
        const isPaid = ["cash", "card", "upi"].includes((b.method || "").toLowerCase());
        if (isPaid)
            prevRevenue += b.total;
    }
    const revenueChange = prevRevenue === 0 ? 100 : ((monthlyRevenue - prevRevenue) / prevRevenue) * 100;
    // Daily revenue for chart (last 7 days OR current month days)
    const dailyRevenue = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const dayStart = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00.000Z`;
        const dayEnd = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}T23:59:59.999Z`;
        const dayBills = database_1.db.prepare(`
      SELECT b.total, p.method FROM bills b
      LEFT JOIN payments p ON p.bill_id = b.id
      WHERE b.created_at >= ? AND b.created_at <= ?
    `).all(dayStart, dayEnd);
        const rev = dayBills.filter(b => ["cash", "card", "upi"].includes((b.method || "").toLowerCase())).reduce((s, b) => s + b.total, 0);
        dailyRevenue.push({ day: String(d), revenue: rev });
    }
    // Service breakdown
    const serviceRows = database_1.db.prepare(`
    SELECT bi.service, SUM(bi.quantity * bi.paper * bi.rate) as total
    FROM bill_items bi
    INNER JOIN bills b ON b.id = bi.bill_id
    WHERE b.created_at >= ? AND b.created_at < ?
    GROUP BY bi.service
    ORDER BY total DESC
  `).all(start, end);
    const serviceTotal = serviceRows.reduce((s, r) => s + r.total, 0);
    const serviceBreakdown = serviceRows.map(r => ({
        name: r.service,
        total: r.total,
        pct: serviceTotal > 0 ? Math.round((r.total / serviceTotal) * 100) : 0
    }));
    // Recent transactions (last 10 in month)
    const recentTx = database_1.db.prepare(`
    SELECT b.id, b.bill_number, b.total, b.created_at, c.name AS customer_name, p.method,
           GROUP_CONCAT(bi.service || ' x' || bi.quantity, ', ') as items
    FROM bills b
    LEFT JOIN customers c ON c.id = b.customer_id
    LEFT JOIN payments p ON p.bill_id = b.id
    LEFT JOIN bill_items bi ON bi.bill_id = b.id
    WHERE b.created_at >= ? AND b.created_at < ?
    GROUP BY b.id
    ORDER BY b.created_at DESC
    LIMIT 10
  `).all(start, end);
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
            status: ["cash", "card", "upi"].includes((t.method || "").toLowerCase()) ? "Paid" : "Pending"
        }))
    };
});
electron_2.ipcMain.handle("get-customers", () => {
    const stmt = database_1.db.prepare(`
    SELECT
      c.id,
      c.name,
      c.phone,
      c.mail,
      c.ref,

      COALESCE(SUM(b.total), 0) AS totalSpent,
      MAX(b.created_at) AS lastVisit,
      COALESCE((
        SELECT SUM(b2.total)
        FROM bills b2
        LEFT JOIN payments p ON p.bill_id = b2.id
        WHERE b2.customer_id = c.id AND (p.method IS NULL OR LOWER(p.method) NOT IN ('cash', 'card', 'upi'))
      ), 0) AS pending

    FROM customers c
    LEFT JOIN bills b ON b.customer_id = c.id
    GROUP BY c.id
    ORDER BY c.id DESC
  `);
    return stmt.all();
});
electron_2.ipcMain.handle("add-customer", (_, customer) => {
    const existing = database_1.db
        .prepare("SELECT id FROM customers WHERE phone = ?")
        .get(customer.phone);
    if (existing) {
        throw new Error("Customer already exists with this phone");
    }
    const stmt = database_1.db.prepare(`
    INSERT INTO customers (name, mail, phone, ref)
    VALUES (?, ?, ?, ?)
  `);
    const result = stmt.run(customer.name, customer.mail, customer.phone, customer.ref);
    return { id: result.lastInsertRowid };
});
const child_process_1 = require("child_process");
const net_1 = __importDefault(require("net"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
let server;
// ⏳ Poll TCP until the server is actually listening, then run callback
function waitForPort(port, host, onReady, onFail, maxAttempts = 40, intervalMs = 500) {
    let attempts = 0;
    const tryConnect = () => {
        const client = new net_1.default.Socket();
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
            }
            else {
                setTimeout(tryConnect, intervalMs);
            }
        })
            .on("timeout", () => {
            client.destroy();
            attempts++;
            if (attempts >= maxAttempts) {
                onFail();
            }
            else {
                setTimeout(tryConnect, intervalMs);
            }
        });
    };
    tryConnect();
}
function createWindow() {
    const mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    mainWindow.setMenuBarVisibility(false);
    const isDev = !electron_1.app.isPackaged;
    if (isDev) {
        mainWindow.loadURL("http://localhost:3000");
        mainWindow.webContents.openDevTools();
    }
    else {
        // Show a simple loading page while the server starts
        mainWindow.loadURL("data:text/html,<html><body style='background:#0f172a;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;color:#94a3b8;font-size:18px;'>Starting TamilPrinter...</body></html>");
        // 🚀 Start Next.js standalone server
        // With asar:false, all app files live at resources/app/
        const standaloneServer = path_1.default.join(process.resourcesPath, "app", ".next", "standalone", "server.js");
        const logFile = path_1.default.join(os_1.default.tmpdir(), "tamilprinter-server.log");
        const logStream = fs_1.default.createWriteStream(logFile, { flags: "a" });
        logStream.write(`\n--- App started at ${new Date().toISOString()} ---\n`);
        logStream.write(`Server path: ${standaloneServer}\n`);
        logStream.write(`Server exists: ${fs_1.default.existsSync(standaloneServer)}\n`);
        server = (0, child_process_1.spawn)(process.execPath, [standaloneServer], {
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
        server.stdout?.on("data", (data) => {
            logStream.write("[stdout] " + data.toString());
        });
        server.stderr?.on("data", (data) => {
            logStream.write("[stderr] " + data.toString());
        });
        server.on("close", (code) => {
            logStream.write(`[server exited] code=${code}\n`);
        });
        server.on("error", (err) => {
            logStream.write(`[spawn error] ${err.message}\n`);
        });
        // ⏳ Poll until port 3000 is listening, then load the app
        waitForPort(3000, "127.0.0.1", () => {
            logStream.write("Server is ready — loading URL\n");
            mainWindow.loadURL("http://127.0.0.1:3000");
        }, () => {
            logStream.write("Server failed to start after max retries\n");
            mainWindow.loadURL(`data:text/html,<html><body style='background:#0f172a;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;color:#f87171;font-size:16px;gap:12px;'>
            <div style='font-size:24px'>⚠️ Server failed to start</div>
            <div style='color:#94a3b8'>Check log: ${logFile.replace(/\\/g, "\\\\")}</div>
          </body></html>`);
        });
    }
}
electron_1.app.whenReady().then(async () => {
    createWindow();
});
electron_1.app.on("will-quit", () => {
    if (server)
        server.kill();
});
