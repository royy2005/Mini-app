import { Router } from "express";
import catalogRouter from "./catalog";

const router = Router();

router.use("/", catalogRouter);

export default router;