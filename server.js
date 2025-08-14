import express, { urlencoded } from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import router from "./config/router.js";
import backupRouter from "./routes/backup.js"

dotenv.config();

const app = express();

//* Rate limiter for backup routes - 10 requests per 5 minutes
const backupLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, //* 5 minutes
  max: 10, //* limit each IP to 10 requests per windowMs
  message: {
    error: "Too many backup requests , please try again after 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(morgan("dev"));

app.get("/", (req, res) => {
  return res.send("Hello world");
});

app.use(router);

app.use("/api/backup", backupLimiter, backupRouter);

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
  console.log(`Server is connected as ${PORT}`);
});
