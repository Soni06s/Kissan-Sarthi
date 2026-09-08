import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve service account from environment variable
let serviceAccount = null;
const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (envPath) {
  const resolvedPath = path.isAbsolute(envPath)
    ? envPath
    : path.resolve(process.cwd(), envPath);
  if (fs.existsSync(resolvedPath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    } catch (err) {
      console.error('Failed to parse Firebase service account JSON from FIREBASE_SERVICE_ACCOUNT_PATH:', err.message);
    }
  }
}

// Fallback: check default file in project root if not loaded yet
if (!serviceAccount) {
  const defaultPath = path.resolve(__dirname, '../../../kissan-sarthi-7a07f-firebase-adminsdk-fbsvc-34ee2dce98.json');
  if (fs.existsSync(defaultPath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
    } catch (err) {
      console.error('Failed to read default Firebase service account JSON:', err.message);
    }
  }
}

// Fallback: build credential from individual env variables if available
if (!serviceAccount && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
}

let app = null;
if (getApps().length === 0) {
  if (serviceAccount) {
    try {
      app = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('Firebase Admin initialized successfully');
    } catch (err) {
      console.error('Firebase Admin initialization error:', err.message);
    }
  } else {
    console.warn('Firebase Admin credentials not found. Google login will require Firebase configuration.');
  }
} else {
  app = getApps()[0];
}

// Export the auth module so other files can use firebaseAdmin.auth().verifyIdToken(...)
export const firebaseAdmin = {
  auth: () => {
    if (!app) {
      throw new Error('Firebase Admin is not initialized. Please verify your service account configuration.');
    }
    return getAuth(app);
  },
};