import express, { urlencoded } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env",
});

const app = express();

connectDB();

const loger = (req, res, next) => {
  console.log("middleware running");

  next();
};

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(loger);
app.use();
app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send({ name: "harmil", email: "name@gmail.com" });
});

const PORT = process.env.PORT || 8000;

app.listen(process.env.PORT, () => {
  console.log(`server running on port ${process.env.PORT}`);
});
