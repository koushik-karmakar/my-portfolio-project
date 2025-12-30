import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

const app = express();
const __dirname = path.resolve();

/* ===================== CORS ===================== */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

/* ===================== MIDDLEWARE ===================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ===================== API ROUTES ===================== */
import { router } from "./routes/user.routes.js";
import { googleRouter } from "./routes/google.routes.js";
import { todoRouter } from "./routes/todo.routes.js";

app.use("/api/users", router);
app.use("/api/users/google-login", googleRouter);
app.use("/api/p1", todoRouter);

/* ===================== FRONTEND ===================== */
app.use(express.static(path.join(__dirname, "../frontend/dist")));

/*  EXPRESS SPA FALLBACK */
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

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
