"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
// Create database connection
const dbPath = path_1.default.join(__dirname, '../../finance_tracker.db');
const db = new sqlite3_1.default.Database(dbPath);
// Promisify database methods manually to avoid type issues
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err)
                reject(err);
            else
                resolve(this);
        });
    });
};
const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err)
                reject(err);
            else
                resolve(row);
        });
    });
};
const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
};
const query = async (text, params) => {
    const start = Date.now();
    // Convert PostgreSQL syntax to SQLite syntax
    let sqliteQuery = text
        .replace(/\$(\d+)/g, '?') // Replace $1, $2, etc. with ?
        .replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
        .replace(/VARCHAR\((\d+)\)/g, 'TEXT')
        .replace(/DECIMAL\((\d+),(\d+)\)/g, 'REAL')
        .replace(/TIMESTAMP/g, 'DATETIME')
        .replace(/CURRENT_TIMESTAMP/g, "datetime('now')")
        .replace(/REFERENCES ([^\s]+)\(([^)]+)\) ON DELETE CASCADE/g, 'REFERENCES $1($2)');
    try {
        if (sqliteQuery.trim().toUpperCase().startsWith('SELECT')) {
            const rows = await dbAll(sqliteQuery, params || []);
            const duration = Date.now() - start;
            console.log('Executed query', { text: sqliteQuery, duration, rows: rows.length });
            return { rows, rowCount: rows.length };
        }
        else {
            const result = await dbRun(sqliteQuery, params || []);
            const duration = Date.now() - start;
            console.log('Executed query', { text: sqliteQuery, duration, changes: result.changes });
            // For INSERT queries, return the inserted row
            if (sqliteQuery.trim().toUpperCase().startsWith('INSERT') && sqliteQuery.includes('RETURNING')) {
                // Handle RETURNING clause by doing a separate SELECT
                const tableName = sqliteQuery.match(/INSERT INTO (\w+)/)?.[1];
                const returningFields = sqliteQuery.match(/RETURNING (.+)$/)?.[1];
                if (tableName && returningFields) {
                    const selectQuery = `SELECT ${returningFields} FROM ${tableName} WHERE rowid = last_insert_rowid()`;
                    const row = await dbGet(selectQuery);
                    return { rows: [row], rowCount: 1 };
                }
            }
            return { rows: [], rowCount: result.changes || 0 };
        }
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};
exports.query = query;
exports.default = db;
//# sourceMappingURL=database.js.map