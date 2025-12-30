import { Router } from "express";
import { googleLogin } from "../controllers/googleAuth.controller.js";
const googleRouter = Router();
googleRouter.route("/").post(googleLogin);
// googleRouter.route("/callback").get(googleCallback);
export { googleRouter };
