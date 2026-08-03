import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the service account file from the KissanSarthi root directory
const serviceAccountPath = path.resolve(__dirname, "../../../kissan-sarthi-7a07f-firebase-adminsdk-fbsvc-34ee2dce98.json");

let serviceAccount;
try {
  const fileContents = fs.readFileSync(serviceAccountPath, "utf8");
  serviceAccount = JSON.parse(fileContents);
} catch (error) {
  console.error("Failed to read Firebase service account JSON:", error);
}

let app;
if (getApps().length === 0 && serviceAccount) {
  try {
    app = initializeApp({
      credential: cert(serviceAccount),
    });
    console.log("Firebase Admin initialized successfully");
  } catch (err) {
    console.error("Firebase Admin initialization error:", err);
  }
} else {
  app = getApps()[0];
}

// Export the auth module so other files can use firebaseAdmin.auth().verifyIdToken(...)
export const firebaseAdmin = {
  auth: () => getAuth(app)
};