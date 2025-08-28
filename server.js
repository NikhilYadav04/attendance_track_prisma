import express, { urlencoded } from "express";
import dotenv from "dotenv";
import router from "./route_config/route.js";
import rateLimit from "express-rate-limit";
import authRouter from "./routes/auth.js";
import backupRouter from "./routes/backup.js";
import morgan from "morgan";

const app = express();
dotenv.config();

//* Rate limiter for backup routes - 10 requests per 5 minutes
const backupLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, //* 5 minutes
  max: 10, //* limit each IP to 10 requests per windowMs
  message: {
    error:
      "Too many backup requests from this IP, please try again after 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

//* log for checking server
app.get("/", (req, res) => {
  res.send("Hello From Nikhil");
});

app.use(express.json());
app.use(
  urlencoded({
    extended: true,
  })
);
app.use(morgan('dev'));

//* all routers inside project
app.use(router);
router.use("/api/auth", authRouter);
router.use("/api/backup", backupLimiter,backupRouter);

//* start the node js server
const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
  console.log(`Server is connected as ${PORT}`);
});
