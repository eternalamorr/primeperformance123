import { randomBytes, scrypt as nodeScrypt } from "node:crypto";
import { promisify } from "node:util";
import { Pool } from "pg";

const scryptAsync = promisify(nodeScrypt);

const usage = () => {
  console.log("Usage:");
  console.log("  node scripts/hash-admin-password.mjs <password>");
  console.log("  node scripts/hash-admin-password.mjs <password> --set <username>");
};

const args = process.argv.slice(2);
const password = args[0];
const setFlagIndex = args.indexOf("--set");
const username = setFlagIndex >= 0 ? args[setFlagIndex + 1] : null;

if (!password) {
  usage();
  process.exit(1);
}

const N = 16384;
const r = 8;
const p = 1;
const keylen = 64;
const salt = randomBytes(16).toString("base64url");
const key = await scryptAsync(password, salt, keylen, { N, r, p });
const hash = `scrypt$${N}$${r}$${p}$${salt}$${Buffer.from(key).toString("base64url")}`;

console.log("password_hash:");
console.log(hash);

if (username) {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("Missing DATABASE_URL for --set mode");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const result = await pool.query(
    `update admin_users
     set password_hash = $1, is_active = true
     where username = $2`,
    [hash, username]
  );
  await pool.end();

  if (result.rowCount === 0) {
    console.error(`Failed to update admin_users for ${username}: user not found`);
    process.exit(1);
  }

  console.log(`Updated admin_users password_hash for username=${username}`);
}
