import { mkdir } from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";
import type { Database, RunResult } from "sqlite3";

// Локальная база лежит в папке data в корне проекта — рядом с package.json.
const DATA_DIR = path.join(process.cwd(), "data");
const DATABASE_FILE = path.join(DATA_DIR, "app.db");

export type NewRequest = {
  name: string;
  email: string;
  description: string;
};

export type SavedRequest = NewRequest & {
  id: number;
  createdAt: string;
};

// В dev-режиме Next.js перезагружает модули при изменении файлов, поэтому соединение
// кешируем в globalThis: иначе на каждую пересборку открывалось бы новое подключение.
const globalForDatabase = globalThis as unknown as {
  appDatabase?: Promise<Database>;
};

// Колбэки sqlite3 оборачиваем в Promise, чтобы в роуте можно было работать через await.
function run(
  database: Database,
  sql: string,
  params: unknown[] = []
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    database.run(sql, params, function onDone(this: RunResult, error: Error | null) {
      if (error) {
        reject(error);
        return;
      }

      resolve(this);
    });
  });
}

async function openDatabase(): Promise<Database> {
  // Папки data может не быть в свежем клоне проекта — создаём её на месте.
  await mkdir(DATA_DIR, { recursive: true });

  const database = await new Promise<Database>((resolve, reject) => {
    const connection = new sqlite3.Database(DATABASE_FILE, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(connection);
    });
  });

  // Таблица создаётся при первом обращении; повторные вызовы ничего не меняют.
  await run(
    database,
    `CREATE TABLE IF NOT EXISTS requests (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       name TEXT NOT NULL,
       email TEXT NOT NULL,
       description TEXT NOT NULL,
       created_at TEXT NOT NULL
     )`
  );

  return database;
}

// Единственное подключение к базе на процесс: создаётся при первом вызове.
export function getDatabase(): Promise<Database> {
  if (!globalForDatabase.appDatabase) {
    globalForDatabase.appDatabase = openDatabase().catch((error: unknown) => {
      // Неудачную попытку не кешируем, чтобы следующий запрос мог открыть базу заново.
      globalForDatabase.appDatabase = undefined;
      throw error;
    });
  }

  return globalForDatabase.appDatabase;
}

// Сохраняет заявку, которая уже прошла серверную проверку Zod.
export async function saveRequest(input: NewRequest): Promise<SavedRequest> {
  const database = await getDatabase();
  const createdAt = new Date().toISOString();

  const result = await run(
    database,
    "INSERT INTO requests (name, email, description, created_at) VALUES (?, ?, ?, ?)",
    [input.name, input.email, input.description, createdAt]
  );

  return { id: result.lastID, createdAt, ...input };
}
