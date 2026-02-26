"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
// Database file location
const dbPath = path_1.default.join(electron_1.app.getPath("userData"), "printout.db");
// Create database
exports.db = new better_sqlite3_1.default(dbPath);
console.log("Database created at:", dbPath);
// Create tables
exports.db.exec(`
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  mail TEXT,
  phone TEXT,
  ref TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  bill_number TEXT,
  total REAL,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS bill_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER,
  service TEXT,
  quantity INTEGER,
  paper INTEGER,
  page INTEGER,
  rate REAL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER,
  method TEXT,
  amount REAL
);
`);
