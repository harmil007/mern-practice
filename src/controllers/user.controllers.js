import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponce.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
  const { username, email, password, fullname } = req.body;
  console.log("userdetails", req.body);

  // step2
  if (
    [username, email, password, fullname].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all fields are required");
  }

  // step 3
  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  // step 4
  if (req.files) {
    const avatarLocalPath = req.files.avatar[0].path;
    const coverImageLocalPath = req.files.coverImage[0].path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
      throw new ApiError(400, "avatar is required");
    }
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

export { registerUser };
