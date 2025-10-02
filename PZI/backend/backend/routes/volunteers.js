import express from "express";
import { firestore, FieldValue } from "../config/firebase.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const COL = "volunteers";

router.get("/", asyncHandler(async (req, res) => {
  const snapshot = await firestore.collection(COL).get();
  res.json(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
}));

router.post("/", requireAuth, asyncHandler(async (req, res) => {
  const docRef = await firestore.collection(COL).add({ ...req.body, ownerId: req.user.uid, createdAt: FieldValue.serverTimestamp() });
  res.status(201).json({ id: docRef.id });
}));

export default router;
