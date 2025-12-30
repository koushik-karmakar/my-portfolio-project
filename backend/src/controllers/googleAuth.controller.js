import { OAuth2Client } from "google-auth-library";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorHandle } from "../utils/ApiErrorHandle.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  refreshTokenCookieOptions,
  accessTokenCookieOptions,
} from "../utils/dev_env.js";

export const googleLogin = asyncHandler(async (req, res) => {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  const { token } = req.body;

  if (!token) {
    throw new ApiErrorHandle(400, "Google token not provided");
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new ApiErrorHandle(500, "Google client ID not configured");
  }

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new ApiErrorHandle(401, "Invalid Google token");
  }
  console.log(payload);
  if (!payload.email_verified) {
    throw new ApiErrorHandle(401, "Google email not verified");
  }

  const { name, email, picture } = payload;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      fullname: name,
      username: email.split("@")[0] + "_" + Date.now(),
      email,
      number: null,
      avatar: picture,
      coverImage: "",
      password: null,
      googleAuth: true,
      isOnline: false,
    });
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const safeUser = {
    _id: user._id,
    fullname: user.fullname,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    googleAuth: user.googleAuth,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenCookieOptions)
    .cookie("refreshToken", refreshToken, refreshTokenCookieOptions)
    .json(new ApiResponse(200, safeUser, "Google login successful"));
});
