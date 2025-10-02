import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.warn("[WARN] JWT_SECRET is not set. Using a weak fallback for development only.");
  process.env.JWT_SECRET = "dev_secret_change_me";
}

import "./config/firebase.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import volunteerRoutes from "./routes/volunteers.js";
import orgRoutes from "./routes/orgs.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => res.json({ ok: true, service: "volontiranje-backend" }));
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/volunteers", volunteerRoutes);
app.use("/orgs", orgRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
