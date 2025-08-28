import { Router } from "express";
import { delete_backup, register } from "../controllers/authControllers.js";

const authRouter = Router();

//* Store User Data In Schema
authRouter.post("/", register);

//* delete a user
authRouter.delete("/",delete_backup);

export default authRouter;
