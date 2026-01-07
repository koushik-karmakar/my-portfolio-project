import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorHandle } from "../utils/ApiErrorHandle.js";
import { User } from "../models/user.model.js";
import {
  updateImageOnCloudinary,
  uploadOnCloudinary,
} from "../utils/fileUpload.js";
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "../utils/dev_env.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { OTP } from "../models/otp.model.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const userdata = await User.findById(userId);
    const genAccessToken = userdata.generateAccessToken();
    const genRefreshToken = userdata.generateRefreshToken();
    userdata.refreshToken = genRefreshToken;
    await userdata.save({ validateBeforeSave: false });
    // return the value of access and refresh so that i can get that data using this function
    return { genAccessToken, genRefreshToken };
  } catch (error) {
    throw new ApiErrorHandle(500, "Somnething went wrong");
  }
};

// get user details from frontend
// validation - not empty
// check if user already exists: username, email
// check for images, check for avatar
// upload them to cloudinary, avatar
// create user object - create entry in db
// remove password and refresh token field from response
// check for user creation
// return res
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body;
  if (
    [fullname, username, email, password].some(
      (item) => !item || item.trim() === ""
    )
  ) {
    throw new ApiErrorHandle(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiErrorHandle(400, "User already existed");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiErrorHandle(400, "Avatar file is required.");
  }

  const avatarUpload = await uploadOnCloudinary(avatarLocalPath);
  const coverImageUpload = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatarUpload) {
    throw new ApiErrorHandle(500, "Avatar file fail to upload.");
  }

  const userInput = await User.create({
    fullname,
    username,
    email,
    password,
    avatar: avatarUpload.url,
    coverImage: coverImageUpload?.url || "",
  });

  const createdUser = await User.findById(userInput._id).select(
    "-password -refreshToken" // ei duto field select habe na, age - sign die start kora hoeche
  );
  if (!createdUser) {
    throw new ApiErrorHandle(500, "User Upload Failed!");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Register Successfully."));
});

// first check the input
//then fetch the user if present
//then generate access and refresh token
//sent the accesstoekn to cookies
const loginUser = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const query = emailRegex.test(identifier)
    ? { email: identifier.toLowerCase() }
    : { username: identifier };

  if (!identifier) {
    throw new ApiErrorHandle(400, "Email or Username is required.");
  }

  const userDataFromDatabase = await User.findOne(query).select("+password");

  if (!userDataFromDatabase) {
    throw new ApiErrorHandle(404, "User not found!");
  }

  const isPasswordMatched = await userDataFromDatabase.isPasswordCorrect(
    password
  );
  if (!isPasswordMatched) {
    throw new ApiErrorHandle(400, "Password not matched!");
  }
  // generate access token and refresh token and get the token for further use
  const { genAccessToken, genRefreshToken } =
    await generateAccessAndRefreshToken(userDataFromDatabase._id);

  // fetch logged in user again without password
  const loggedInUser = await User.findById(userDataFromDatabase._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", genAccessToken, accessTokenCookieOptions)
    .cookie("refreshToken", genRefreshToken, refreshTokenCookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          safeUser: loggedInUser,
          genAccessToken,
          genRefreshToken,
        },
        "User loggedin Successfully"
      )
    );
});

const isUserLoggedIn = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        logged_In: true,
        user: req.user,
      },
      "User loggedin Successfully"
    )
  );
});
// logout suer}
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", accessTokenCookieOptions)
    .clearCookie("refreshToken", refreshTokenCookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // note: express populates cookies on `req.cookies`
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiErrorHandle(401, "Refresh Token not found");
  }
  try {
    const decodedToekn = jwt.verify(
      // {decodedToekn} store a object that help in authentication
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const userData = await User.findById(decodedToekn?._id).select("-password");
    if (!userData) {
      throw new ApiErrorHandle(400, "Refresh Token not found");
    }

    if (incomingRefreshToken !== userData?.refreshToken) {
      throw new ApiErrorHandle(400, "Invalid Refresh Token");
    }

    // generate new tokens (function returns { genAccessToken, genRefreshToken })
    const { genAccessToken, genRefreshToken } =
      await generateAccessAndRefreshToken(userData._id);

    return res
      .status(200)
      .cookie("accessToken", genAccessToken, accessTokenCookieOptions)
      .cookie("refreshToken", genRefreshToken, refreshTokenCookieOptions)
      .json(
        new ApiResponse(
          200,
          {
            genAccessToken,
            genRefreshToken,
          },
          "Access Token refreshed."
        )
      );
  } catch (error) {
    throw new ApiErrorHandle(500, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword) {
    throw new ApiErrorHandle(
      400,
      "Please match password with confirm password."
    );
  }
  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiErrorHandle(400, "Invalid Password!");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully."));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User Fetched successfully.")); //req.user this comes from middelware
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullname, // if both name same then write just email
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully."));
});

const updateAvater = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiErrorHandle(400, "Avatar file not uploaded!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiErrorHandle(400, "Avatar file fail to upload on server!");
  }
  const oldImage = await User.findById(req.user._id);
  const updatedCloudinaryImage = await updateImageOnCloudinary(
    oldImage.avatar,
    avatarLocalPath
  );

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: updatedCloudinaryImage,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User avatar update successfully."));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocal = req.file?.path;
  if (!coverImageLocal) {
    throw new ApiErrorHandle(400, "Cover Image not upladed!");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocal);
  if (!coverImage.url) {
    throw new ApiErrorHandle(400, "Cover Image not upladed!");
  }
  const oldCoverImage = await User.findById(req.user._id);
  const updateCoverImgOnCloudinary = await updateImageOnCloudinary(
    oldCoverImage.coverImage,
    coverImageLocal
  );

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: updateCoverImgOnCloudinary,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully."));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiErrorHandle(400, "User name not found!");
  }

  const getChannel = await User.aggregate([
    {
      $match: { username: username?.toLowerCase() },
    },
    {
      $lookup: {
        from: "subscriptions",
        foreignField: "channel",
        localField: "_id",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        foreignField: "subscriber",
        localField: "_id",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        channelSubcribedToCount: {
          $size: "$subscribedTo",
        },
        isCubcribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscriberCount: 1,
        channelSubcribedToCount: 1,
        isCubcribed: 1,
      },
    },
  ]); //aggregate pipeline retuen arrays in result

  if (!getChannel?.length) {
    throw new ApiErrorHandle(404, "Channel does not exist.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Channels fetched successfully."));
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        // _id: req.user._id, //when $match work for collect data through _id, in aggregate method, mongoose not work,
        // so we directly not send the id in string, we modify string into objectID
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        foreignField: "_id",
        localField: "watchHistory",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              foreignField: "_id",
              localField: "owner",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullname: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  if (!user || !user.length) {
    throw new ApiErrorHandle(400, "User not found!");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History fetched successfully"
      )
    ); // user return an array
});

const getNumber = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiErrorHandle(401, "Unauthorized");
  }

  const user = await User.findById(req.user._id).select("+number");

  if (!user) {
    throw new ApiErrorHandle(404, "User not found");
  }

  if (!user.number) {
    throw new ApiErrorHandle(400, "User's number not added");
  }

  return res.status(200).json(new ApiResponse(200, { number: user.number }));
});

const send_mail_otp = asyncHandler(async (req, res) => {
  try {
    const { email, number } = req.body;
    if (!email || !number) {
      return res.status(404).json({ message: "Request Failed!" });
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const otp = (
      (parseInt(crypto.randomBytes(3).toString("hex"), 16) % 900000) +
      100000
    ).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    await OTP.findOneAndUpdate(
      { email },
      {
        userId: user._id,
        phone: number,
        otp: hashedOtp,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Phone Number Verification</h2>
          <p>Hello ${user.fullname},</p>
          <p>You are trying to add the phone number: <strong>${number}</strong></p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin: 0;">Your OTP Code:</h3>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5; margin: 10px 0;">
              ${otp}
            </div>
            <p style="color: #64748b; font-size: 14px; margin: 5px 0;">
              This OTP will expire in 10 minutes
            </p>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            If you didn't request this, please ignore this email or contact support.
          </p>
        </div>
      `,
    };

    const sendMail = await transporter.sendMail(mailOptions);
    if (sendMail) {
      res.status(200).json({
        message: "OTP sent successfully to your email",
        emailSent: true,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error sending OTP", error: error.message });
  }
});

const verify_mail_otp = asyncHandler(async (req, res) => {
  try {
    const { email, otp, number } = req.body;
    if (!email || !otp || !number) {
      return res
        .status(400)
        .json({ message: "Email, OTP, and number are required!" });
    }

    const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (!otpRecord) return res.status(404).json({ message: "OTP not found" });

    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid) return res.status(400).json({ message: "Invalid OTP" });

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { number },
      { new: true }
    );

    const delOtp = await OTP.deleteOne({ _id: otpRecord._id });

    if (!updatedUser || delOtp.deletedCount === 0) {
      return res.status(500).json({ message: "Failed to verify OTP" });
    }

    return res.status(200).json({
      message: "OTP verified and phone number updated successfully",
      user: updatedUser,
      emailVerified: true,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error verifying OTP", error: error.message });
  }
});

const checkNumberExists = asyncHandler(async (req, res) => {
  const { number } = req.body;

  if (!number) {
    throw new ApiErrorHandle(400, "Number is required");
  }

  const exists = await User.exists({ number });

  return res.status(200).json(new ApiResponse(200, { exists }));
});

const searchNewUser = asyncHandler(async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user._id;

    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const isNumber = /^\d+$/.test(q);

    let query = {};

    if (isNumber) {
      query = {
        number: { $regex: q },
        _id: { $ne: userId },
      };
    } else {
      query = {
        username: { $regex: q, $options: "i" },
        number: { $exists: true, $ne: null },
        _id: { $ne: userId },
      };
    }

    const users = await User.find(query)
      .select("_id username fullname number avatar isOnline lastSeen email")
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Error searching new user",
      error: error.message,
    });
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateAvater,
  updateCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
  isUserLoggedIn,
  getNumber,
  checkNumberExists,
  send_mail_otp,
  verify_mail_otp,
  searchNewUser,
};
