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


-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);
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

