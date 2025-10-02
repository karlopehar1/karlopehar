import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { firestore } from "../config/firebase.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

const signToken = (user) =>
  jwt.sign({ uid: user.id, email: user.email, role: user.role || "user" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

router.post("/register", asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const snapshot = await firestore.collection("users").where("email", "==", email).limit(1).get();
  if (!snapshot.empty) return res.status(409).json({ message: "User exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const docRef = await firestore.collection("users").add({ name, email, passwordHash, role: role || "user" });
  const user = { id: docRef.id, email, role: role || "user" };
  res.status(201).json({ token: signToken(user), user });
}));

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const snapshot = await firestore.collection("users").where("email", "==", email).limit(1).get();
  if (snapshot.empty) return res.status(401).json({ message: "Invalid credentials" });

  const doc = snapshot.docs[0];
  const data = doc.data();
  const ok = await bcrypt.compare(password, data.passwordHash || "");
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const user = { id: doc.id, email: data.email, role: data.role || "user" };
  res.json({ token: signToken(user), user });
}));

export default router;
