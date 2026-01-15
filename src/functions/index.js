const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.createUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Login required"
    );
  }

  const creatorUid = context.auth.uid;
  const creatorSnap = await admin
    .firestore()
    .doc(`users/${creatorUid}`)
    .get();

  if (!creatorSnap.exists || creatorSnap.data().role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admins only"
    );
  }

  const { name, email, role, shopId } = data;

  const tempPassword = Math.random().toString(36).slice(-8);

  const userRecord = await admin.auth().createUser({
    email,
    password: tempPassword,
  });

  await admin.firestore().doc(`users/${userRecord.uid}`).set({
    name,
    email,
    role,
    shopId: role === "admin" ? null : shopId ?? null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    uid: userRecord.uid,
    tempPassword,
  };
});
