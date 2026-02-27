import { randomBytes, scrypt as nodeScrypt } from "node:crypto";
import { promisify } from "node:util";
import { createClient } from "@supabase/supabase-js";

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
  const url = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for --set mode");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

  const { error } = await supabase
    .from("admin_users")
    .update({ password_hash: hash, is_active: true })
    .eq("username", username);

  if (error) {
    console.error(`Failed to update admin_users for ${username}: ${error.message}`);
    process.exit(1);
  }

  console.log(`Updated admin_users password_hash for username=${username}`);
}
