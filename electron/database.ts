import Database from "better-sqlite3";
import path from "path";
import { app } from "electron";

// Database file location
const dbPath = path.join(app.getPath("userData"), "printout.db");

// Create database with a timeout to handle busy scenarios
export const db = new Database(dbPath, { timeout: 20000 });

// Enable WAL mode to allow concurrent reads/writes
try {
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 20000');
  db.pragma('synchronous = NORMAL');
} catch (e) {
  console.warn("Failed to set WAL mode:", e);
}

console.log("Database created at:", dbPath);

// Create tables
db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  mail TEXT,
  phone TEXT UNIQUE NOT NULL,
  ref TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  bill_number TEXT UNIQUE,
  total REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bill_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL,
  service TEXT,
  quantity INTEGER NOT NULL,
  paper INTEGER NOT NULL,
  page INTEGER,
  rate REAL NOT NULL,
  note TEXT,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL,
  method TEXT NOT NULL,
  amount REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  sku TEXT,
  description TEXT,
  pricing_model TEXT DEFAULT 'Per Unit / Item',
  cost_price REAL DEFAULT 0,
  tax_rate TEXT DEFAULT 'None (0%)',
  track_stock INTEGER DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bill_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  snapshot TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL,
  old_payment_method TEXT,
  new_payment_method TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS split_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL,
  method TEXT NOT NULL,
  amount REAL NOT NULL,
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Initialize counters if not exists
INSERT OR IGNORE INTO settings (key, value) VALUES ('paper_counter', '0');
INSERT OR IGNORE INTO settings (key, value) VALUES ('ink_counter', '0');


-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);
CREATE INDEX IF NOT EXISTS idx_split_payments_bill_id ON split_payments(bill_id);
`);

// Safe migration for updated_at column
try {
  const tableInfo = db.prepare("PRAGMA table_info(bills)").all() as any[];
  const hasUpdatedAt = tableInfo.some(col => col.name === 'updated_at');
  if (!hasUpdatedAt) {
    console.log("[Migration] Adding updated_at column to bills table...");
    db.exec("ALTER TABLE bills ADD COLUMN updated_at TEXT;");
    console.log("[Migration] Column added successfully.");
  } else {
    console.log("[Migration] Column updated_at already exists.");
  }
} catch (error) {
  console.error("[Migration Error] Failed to alter table:", error);
}

// Safe migration for paid_amount and status columns on bills
try {
  const tableInfo = db.prepare("PRAGMA table_info(bills)").all() as any[];
  const hasPaidAmount = tableInfo.some((col: any) => col.name === 'paid_amount');
  if (!hasPaidAmount) {
    console.log("[Migration] Adding paid_amount column to bills table...");
    db.exec("ALTER TABLE bills ADD COLUMN paid_amount REAL DEFAULT 0;");
    console.log("[Migration] paid_amount column added successfully.");
  }
  const hasStatus = tableInfo.some((col: any) => col.name === 'status');
  if (!hasStatus) {
    console.log("[Migration] Adding status column to bills table...");
    db.exec("ALTER TABLE bills ADD COLUMN status TEXT DEFAULT 'Pending';");
    console.log("[Migration] status column added successfully.");

    // Backfill existing bills: derive status from payments table
    const bills = db.prepare(`
      SELECT b.id, b.total, p.method, p.amount as paid
      FROM bills b
      LEFT JOIN payments p ON p.bill_id = b.id
    `).all() as any[];
    for (const bill of bills) {
      const isPaidMethod = ['cash', 'card', 'upi'].includes((bill.method || '').toLowerCase());
      const paidAmount = isPaidMethod ? bill.total : 0;
      const status = isPaidMethod ? 'Paid' : 'Pending';
      db.prepare("UPDATE bills SET paid_amount = ?, status = ? WHERE id = ?").run(paidAmount, status, bill.id);
    }
    console.log("[Migration] Backfilled status for existing bills.");
  }
} catch (error) {
  console.error("[Migration Error] Failed to add paid_amount/status:", error);
}

