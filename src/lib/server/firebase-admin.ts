import admin from "firebase-admin";
import { readFileSync } from "fs";

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App;

try {
  const serviceAccount = JSON.parse(
    readFileSync(
      "/home/bridger/git/scad/src/lib/server/firebase-admin-key.json",
      "utf8",
    ),
  );

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "scad-bridgerb-com.firebasestorage.app",
  });

  console.log("Firebase Admin initialized successfully");
} catch (error) {
  console.error("Failed to initialize Firebase Admin:", error);
  throw error;
}

export const storage = firebaseApp.storage();
export const bucket = storage.bucket();

export default firebaseApp;
