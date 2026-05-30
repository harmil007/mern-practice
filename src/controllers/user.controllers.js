import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponce.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

const clearLocalFiles = (files) => {
  if (!files) return;
  if (files.avatar && files.avatar[0]) {
    try {
      fs.unlinkSync(files.avatar[0].path);
    } catch (e) {}
  }
  if (files.coverImage && files.coverImage[0]) {
    try {
      fs.unlinkSync(files.coverImage[0].path);
    } catch (e) {}
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // user deatails
  // validate the details
  // check if user is already exist
  // check for avatar and coverImage
  // upload them to cloudinary
  // create user in database
  // remove password and refresh token field from response
  // send response

  // step1
  const { username, email, password, fullname } = req.body || {};
  console.log("userdetails", req.body);

  // step2
  if (
    !username ||
    !email ||
    !password ||
    !fullname ||
    [username, email, password, fullname].some((field) => field.trim() === "")
  ) {
    clearLocalFiles(req.files);
    throw new ApiError(400, "all fields are required");
  }

  // step 3
  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    clearLocalFiles(req.files);
    throw new ApiError(409, "User already exists");
  }

  // step 4
  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "avatar is required");
  }

  const user = await User.create({
    username,
    email,
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get user deatails
  // validate user deatails
  // check if user is exist
  // check if password is correct
  // access token and refresh token generate
  // store refresh token in cookie
  // send response

  const { email, password } = req.body;

  if (
    !email ||
    !password ||
    [email, password].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "all fields are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(400, "user not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "Login successful"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export { registerUser, loginUser, logoutUser };
