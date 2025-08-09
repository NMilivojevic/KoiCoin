import sqlite3 from 'sqlite3';
import path from 'path';

// Create database connection
const dbPath = path.join(__dirname, '../../finance_tracker.db');
const db = new sqlite3.Database(dbPath);

// Promisify database methods manually to avoid type issues
const dbRun = (sql: string, params: any[] = []): Promise<sqlite3.RunResult> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(this: sqlite3.RunResult, err: Error | null) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err: Error | null, row: any) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err: Error | null, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  
  // Convert PostgreSQL syntax to SQLite syntax
  let sqliteQuery = text
    .replace(/\$(\d+)/g, '?')  // Replace $1, $2, etc. with ?
    .replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replace(/VARCHAR\((\d+)\)/g, 'TEXT')
    .replace(/DECIMAL\((\d+),(\d+)\)/g, 'REAL')
    .replace(/CURRENT_TIMESTAMP/g, "(datetime('now'))")  // Do this BEFORE TIMESTAMP replacement
    .replace(/TIMESTAMP/g, 'DATETIME')
    .replace(/CURRENT_DATETIME/g, "(datetime('now'))")
    .replace(/REFERENCES ([^\s]+)\(([^)]+)\) ON DELETE CASCADE/g, 'REFERENCES $1($2)');
    
  // Store RETURNING clause info before removing it
  const returningMatch = sqliteQuery.match(/\sRETURNING (.+)$/i);
  const returningFields = returningMatch?.[1];
  sqliteQuery = sqliteQuery.replace(/\sRETURNING .+$/i, '');

  try {    
    if (sqliteQuery.trim().toUpperCase().startsWith('SELECT')) {
      const rows = await dbAll(sqliteQuery, params || []);
      const duration = Date.now() - start;
      console.log('Executed query', { text: sqliteQuery, duration, rows: rows.length });
      return { rows, rowCount: rows.length };
    } else {
      const result = await dbRun(sqliteQuery, params || []);
      const duration = Date.now() - start;
      console.log('Executed query', { text: sqliteQuery, duration, changes: result.changes });
      
      // For INSERT queries, return the inserted row if RETURNING was requested
      if (sqliteQuery.trim().toUpperCase().startsWith('INSERT') && returningFields) {
        // Handle RETURNING clause by doing a separate SELECT
        const tableName = sqliteQuery.match(/INSERT INTO (\w+)/)?.[1];
        if (tableName && returningFields) {
          const selectQuery = `SELECT ${returningFields} FROM ${tableName} WHERE rowid = ${result.lastID}`;
          const row = await dbGet(selectQuery);
          return { rows: [row], rowCount: 1 };
        }
      }
      
      return { rows: [], rowCount: result.changes || 0 };
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export default db;