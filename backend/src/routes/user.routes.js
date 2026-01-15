import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  updateUserDetails,
  updateAvater,
  updateCoverImage,
  getCurrentUser,
  getUserChannelProfile,
  getUserWatchHistory,
  isUserLoggedIn,
  getNumber,
  checkNumberExists,
  verify_mail_otp,
  send_mail_otp,
  searchNewUser,
} from "../controllers/user.controller.js";

const router = Router();
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { getConnectedUser, getMessages } from "../controllers/chat.controller.js";

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/auth-user").get(verifyJWT, isUserLoggedIn);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);

// For Chat App - User Management
router.route("/user-number").post(verifyJWT, getNumber);
router.route("/user-number-check").post(verifyJWT, checkNumberExists);
router.route("/send-mail-otp").post(verifyJWT, send_mail_otp);
router.route("/verify-mail-otp").post(verifyJWT, verify_mail_otp);
router.route("/update-user/details").patch(verifyJWT, updateUserDetails);

// ===================== CHAT ROUTES =====================
router.route("/search").get(verifyJWT, searchNewUser);
router.route("/get-connected-user").get(verifyJWT, getConnectedUser);
router.route("/get-messages").get(verifyJWT, getMessages);
router
  .route("/update-user/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateAvater);
router
  .route("/update-user/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateCoverImage);
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watch-history").get(verifyJWT, getUserWatchHistory);

export { router };
