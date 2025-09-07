import admin from "firebase-admin";
import { getApp, getApps } from "firebase-admin/app";
import { env } from "$env/dynamic/private";
import { building } from "$app/environment";

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App | null = null;

// Don't initialize during build process
if (!building) {
  try {
    // Check if Firebase app already exists (prevents HMR conflicts)
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = getApp();
      console.log("Firebase Admin reused existing app");
    } else {
      // Check if we have the service account key as environment variable
      if (!env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        throw new Error(
          "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set",
        );
      }

      // Decode base64-encoded service account JSON
      const serviceAccountJson = Buffer.from(
        env.FIREBASE_SERVICE_ACCOUNT_KEY,
        "base64",
      ).toString("utf8");
      const serviceAccount = JSON.parse(serviceAccountJson);

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "scad-bridgerb-com.firebasestorage.app",
      });

      console.log("Firebase Admin initialized successfully");
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw error;
  }
}

export const storage = firebaseApp?.storage();
export const bucket = storage?.bucket();

export default firebaseApp;
