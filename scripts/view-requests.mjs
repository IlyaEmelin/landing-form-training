// Просмотр заявок, которые API-роут (src/app/api/requests/route.ts) сохраняет
// в локальную базу SQLite через src/lib/db.ts.
//
// Запуск: npm run view:requests
//
// Файл специально с расширением .mjs: так можно использовать import/await,
// не добавляя "type": "module" в package.json.

import { access } from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";

// Тот же файл базы, что и в src/lib/db.ts: <корень проекта>/data/app.db.
// Путь считаем от самого скрипта, поэтому он не зависит от текущей папки запуска.
const DATABASE_FILE = path.join(import.meta.dirname, "..", "data", "app.db");

// Открываем базу только для чтения: скрипт ничего не меняет и не мешает dev-серверу.
function openDatabase() {
  return new Promise((resolve, reject) => {
    const database = new sqlite3.Database(
      DATABASE_FILE,
      sqlite3.OPEN_READONLY,
      (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(database);
      }
    );
  });
}

// Колбэки sqlite3 оборачиваем в Promise — как это сделано в src/lib/db.ts.
function selectAll(database, sql) {
  return new Promise((resolve, reject) => {
    database.all(sql, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

function closeDatabase(database) {
  return new Promise((resolve, reject) => {
    database.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

// Значение created_at пишется в ISO-формате (см. saveRequest в src/lib/db.ts),
// поэтому показываем и привычное локальное время, и исходное значение из базы.
function formatCreatedAt(createdAt) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return `${date.toLocaleString("ru-RU")} (${createdAt})`;
}

function printRequests(rows) {
  if (rows.length === 0) {
    console.log("Заявок пока нет.");
    console.log("Отправьте форму на странице проекта — заявка появится здесь.");
    return;
  }

  for (const row of rows) {
    console.log(`Заявка #${row.id}`);
    console.log(`  Имя:      ${row.name}`);
    console.log(`  Email:    ${row.email}`);
    console.log(`  Описание: ${row.description}`);
    console.log(`  Создана:  ${formatCreatedAt(row.created_at)}`);
    console.log("");
  }

  console.log(`Всего заявок: ${rows.length}`);
}

async function main() {
  // Если базы ещё нет, подсказываем, откуда она берётся, вместо ошибки драйвера.
  try {
    await access(DATABASE_FILE);
  } catch {
    console.log(`Файл базы не найден: ${DATABASE_FILE}`);
    console.log(
      "Он создаётся при первой сохранённой заявке: запустите npm run dev и отправьте форму."
    );
    return;
  }

  const database = await openDatabase();

  try {
    // ORDER BY id — тот же порядок, в котором заявки сохранялись.
    const rows = await selectAll(
      database,
      "SELECT id, name, email, description, created_at FROM requests ORDER BY id"
    );

    printRequests(rows);
  } finally {
    await closeDatabase(database);
  }
}

main().catch((error) => {
  console.error("Не удалось прочитать заявки из SQLite:", error.message);
  process.exitCode = 1;
});
