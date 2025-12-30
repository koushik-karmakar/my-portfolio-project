import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiErrorHandle } from "../utils/ApiErrorHandle.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  const token =
    req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    throw new ApiErrorHandle(401, "Access token missing");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiErrorHandle(401, "Access token expired");
    }
    throw new ApiErrorHandle(401, "Invalid access token");
  }

  if (!decoded?._id) {
    throw new ApiErrorHandle(401, "Invalid token payload");
  }

  const user = await User.findById(decoded._id);

  if (!user) {
    throw new ApiErrorHandle(401, "User no longer exists");
  }

  req.user = user;
  next();
});
