import { Router } from "express";
import {
  add_backup,
  get_backup,
  get_backup_timetable,
  send_email,
} from "../controllers/backupController.js";
import { delete_backup } from "../controllers/authControllers.js";

const backupRouter = Router();

//* add user data for backup
backupRouter.post("/", add_backup);

//* fetch backup data
backupRouter.get("/:name/:uniqueKey", get_backup);

//* send unique key to email
backupRouter.post("/email", send_email);

// //* backup add timetable
// backupRouter.post("/add-timetable", uploadTimetable,add_backup);

//* backup get timetable
backupRouter.get("/get-timetable", get_backup_timetable);

export default backupRouter;
