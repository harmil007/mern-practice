import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

const loger = (req, res, next) => {
  console.log("middleware running");

  next();
};

app.use(cors());
app.use(loger);

app.use(express.json());

app.get("/", (req, res) => {
  res.send({ name: "harmil", email: "name@gmail.com" });
});

const PORT = process.env.PORT || 8000;

app.listen(process.env.PORT, () => {
  console.log(`server running on port ${process.env.PORT}`);
});
