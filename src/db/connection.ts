import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

function findDbPath(): string {
  if (process.env.DATABASE_PATH && fs.existsSync(process.env.DATABASE_PATH)) {
    return process.env.DATABASE_PATH;
  }
  const candidates = [
    path.resolve(process.cwd(), 'cardo_board.db'),
    path.resolve(process.cwd(), '../cardo_board.db'),
    path.resolve(process.cwd(), '../../cardo_board.db'),
    '/home/jeo/.gemini/antigravity/scratch/cardo-board/cardo_board.db'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[candidates.length - 1];
}

const dbPath = findDbPath();
console.log(`[Cardo DB] Connected to SQLite database at: ${dbPath}`);

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function getDb() {
  return db;
}
