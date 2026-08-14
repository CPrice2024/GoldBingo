import { Router } from "express";
import { getMyProfile } from "./user.controller";

const router = Router();

router.get("/me", getMyProfile);

export default router;