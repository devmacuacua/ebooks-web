/**
 * Replaces __FIREBASE_*__ placeholders in the built service worker with
 * actual values from environment variables. Runs as a postbuild step.
 *
 * The service worker lives in public/ so Next.js copies it to .next/standalone/public/
 * and to the output root. We patch all three locations so both `next start` and
 * standalone Docker deployments work.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const TARGETS = [
  path.join(ROOT, "public", "firebase-messaging-sw.js"),
  path.join(ROOT, ".next", "static", "firebase-messaging-sw.js"),
  path.join(ROOT, ".next", "standalone", "public", "firebase-messaging-sw.js"),
];

const replacements = {
  __FIREBASE_API_KEY__: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  __FIREBASE_AUTH_DOMAIN__: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  __FIREBASE_PROJECT_ID__: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  __FIREBASE_MESSAGING_SENDER_ID__: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  __FIREBASE_APP_ID__: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

let patched = 0;
for (const target of TARGETS) {
  if (!fs.existsSync(target)) continue;
  let content = fs.readFileSync(target, "utf8");
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replaceAll(key, value);
  }
  fs.writeFileSync(target, content, "utf8");
  console.log(`[inject-firebase-sw] Patched ${path.relative(ROOT, target)}`);
  patched++;
}

if (patched === 0) {
  console.warn("[inject-firebase-sw] No service worker files found to patch.");
}
