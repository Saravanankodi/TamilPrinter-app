"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const electron_2 = require("electron");
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
        const lastBill = database_1.db
            .prepare(`SELECT bill_number FROM bills ORDER BY id DESC LIMIT 1`)
            .get();
        let nextNumber = 1;
        if (lastBill) {
            const lastNum = Number(lastBill.bill_number.replace("INV-", ""));
            nextNumber = lastNum + 1;
        }
        const billNumber = `INV-${String(nextNumber).padStart(5, "0")}`;
        const billResult = database_1.db.prepare(`
      INSERT INTO bills (customer_id, bill_number, total, created_at)
      VALUES (?, ?, ?, ?)
    `).run(customerId, billNumber, total, new Date().toISOString());
        const billId = Number(billResult.lastInsertRowid);
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
        return { success: true, billNumber };
    });
    return transaction();
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
    return { bill, items, customer };
});
electron_2.ipcMain.handle("get-bills", () => {
    const stmt = database_1.db.prepare(`
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
    const bills = stmt.all();
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
electron_2.ipcMain.handle("get-customers", () => {
    return database_1.db
        .prepare("SELECT * FROM customers ORDER BY id DESC")
        .all();
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
    mainWindow.loadURL("http://localhost:3000");
}
electron_1.app.whenReady().then(async () => {
    // Load DB AFTER app ready
    await Promise.resolve().then(() => __importStar(require("./database")));
    createWindow();
});
