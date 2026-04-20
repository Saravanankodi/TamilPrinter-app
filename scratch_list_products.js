const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);
const products = db.prepare('SELECT * FROM products').all();
console.log(JSON.stringify(products, null, 2));
db.close();
