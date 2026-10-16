// Remove o banco local para que seja recriado a partir de data/seed na próxima requisição.
import { rm } from "node:fs/promises";
import path from "node:path";

const file = process.env.ROADMAP_DATA_FILE
  ? path.resolve(process.cwd(), process.env.ROADMAP_DATA_FILE)
  : path.join(process.cwd(), "data", "local", "db.json");

await rm(file, { force: true });
console.log(`Banco local removido: ${path.relative(process.cwd(), file)}. Ele será recriado a partir de data/seed.`);
