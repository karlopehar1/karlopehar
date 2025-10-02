import express from "express";
import bcrypt from "bcryptjs";
import { firestore, FieldValue } from "../config/firebase.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const snapshot = await firestore.collection("users").get();
  res.json(snapshot.docs.map((d) => ({ id: d.id, ...d.data(), passwordHash: undefined })));
}));

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const doc = await firestore.collection("users").doc(req.user.uid).get();
  if (!doc.exists) return res.status(404).json({ message: "Not found" });
  const data = doc.data();
  delete data.passwordHash;
  res.json({ id: doc.id, ...data });
}));

router.put("/me", requireAuth, asyncHandler(async (req, res) => {
  const { name, password } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (password) updates.passwordHash = await bcrypt.hash(password, 10);
  updates.updatedAt = FieldValue.serverTimestamp();
  await firestore.collection("users").doc(req.user.uid).update(updates);
  res.json({ message: "Updated" });
}));

export default router;
