import sqlite3 from 'sqlite3';
declare const db: sqlite3.Database;
export declare const query: (text: string, params?: any[]) => Promise<{
    rows: any[];
    rowCount: number;
}>;
export default db;
//# sourceMappingURL=database.d.ts.map