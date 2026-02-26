import Database from "better-sqlite3";
import path from "path";
import { app } from "electron";

// Database file location
const dbPath = path.join(app.getPath("userData"), "printout.db");

// Create database
export const db = new Database(dbPath);

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);
`);
