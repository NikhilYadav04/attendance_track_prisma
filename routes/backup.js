import { Router } from "express";
import {
  add_backup,
  delete_backup,
  get_backup,
} from "../controllers/backupController.js";
const backupRouter = Router();

//* add backup data
backupRouter.post("/", add_backup);

//* get backup data
backupRouter.get("/:name/:uniqueKey", get_backup);

//* delete backup data ( if user deletes his account )
backupRouter.delete("/", delete_backup);

export default backupRouter;
