import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  add_backup,
  delete_backup,
  get_backup,
  send_email,
} from "../controllers/backupController.js";

const backupRouter = Router();

//* Rate Limiter for email sending( 10 requests per day )
const emailLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many email requests today. Please try again tomorrow.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

//* add backup data
backupRouter.post("/", add_backup);

//* send key to user email
backupRouter.post("/email", emailLimiter, send_email);

//* get backup data
backupRouter.get("/:name/:uniqueKey", get_backup);

//* delete backup data ( if user deletes his account )
backupRouter.delete("/", delete_backup);

export default backupRouter;
