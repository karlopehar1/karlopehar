import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadServiceAccount() {
  const b64 = process.env.FIREBASE_KEY_JSON_BASE64;
  if (b64) {
    const json = Buffer.from(b64, "base64").toString("utf-8");
    return JSON.parse(json);
  }

  const keyPath = process.env.FIREBASE_KEY_PATH || path.join(__dirname, "..", "firebaseKey.json");
  if (!fs.existsSync(keyPath)) {
    throw new Error("Firebase service key not found.");
  }
  const content = fs.readFileSync(keyPath, "utf-8");
  return JSON.parse(content);
}

if (!admin.apps.length) {
  const serviceAccount = loadServiceAccount();
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

export const firestore = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;
