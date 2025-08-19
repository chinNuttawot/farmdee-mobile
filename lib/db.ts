// lib/db.ts (SDK 53+ with new async SQLite API)
import * as SQLite from 'expo-sqlite';

// ทำเป็น singleton ป้องกันเปิด DB ซ้ำ
let _dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
async function getDb() {
  if (!_dbPromise) {
    _dbPromise = SQLite.openDatabaseAsync('wfm.db');
  }
  return _dbPromise;
}

// ส่งรูปทรงผลลัพธ์ให้คล้ายของเดิม (rows._array, insertId, rowsAffected)
type LegacyResultLike = {
  rows: { _array: any[] };
  insertId?: number;
  rowsAffected?: number;
};

// ใช้ได้ทั้ง SELECT และ INSERT/UPDATE/DELETE
export async function exec(sql: string, params: any[] = []): Promise<LegacyResultLike> {
  const db = await getDb();

  // แยกประเภท query แบบง่าย ๆ
  const isSelect = /^\s*select/i.test(sql);

  if (isSelect) {
    // SELECT → คืน rows._array
    const rows = await db.getAllAsync(sql, params);
    return { rows: { _array: rows } };
  } else {
    // เขียนข้อมูล → คืน insertId / rowsAffected
    // runAsync รองรับพารามิเตอร์แบบ ...args หรือ array ก็ได้
    const res = Array.isArray(params) ? await db.runAsync(sql, ...params) : await db.runAsync(sql, params);
    return { rows: { _array: [] }, insertId: res.lastInsertRowId, rowsAffected: res.changes };
  }
}
