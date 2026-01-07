import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const app = express();
/* ===================== CORS ===================== */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

/* ===================== MIDDLEWARE ===================== */
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

/* ===================== API ROUTES ===================== */
import { router } from "./routes/user.routes.js";

import { googleRouter } from "./routes/google.routes.js";
import { todoRouter } from "./routes/todo.routes.js";

app.use("/api/users/google-login", googleRouter);
app.use("/api/p1", todoRouter);
app.use("/api/users", router);

/* ===================== FRONTEND ===================== */
const __dirname = dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === "production") {
  const buildPath = join(__dirname, "..", "client", "dist");
  app.use(express.static(buildPath));

  app.get("*", (req, res) => {
    res.sendFile(join(buildPath, "index.html"));
  });
}
/* ===================== ERROR HANDLER ===================== */
app.use((err, req, res, next) => {
  console.error(err);

  if (err?.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || "Something went wrong",
      errors: err.error || [],
    });
  }

  res.status(500).json({
    success: false,
    message: err?.message || "Internal Server Error",
  });
});

export { app };
