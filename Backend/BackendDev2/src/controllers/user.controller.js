import {asyncHandler} from "../utils/aysncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
const registerUser = asyncHandler(async (req,res)=>{
   // jab form ya json se data aa rha hai toh body mein mil jayega
   const {fullName,email,username,password}=req.body
   console.log("email:",email);
   // if(fullName===""){
   //    throw new ApiError(400,"fullname is required")
   // }
   // Validation check
   if(
      [fullName,email,username,password].some((field)=>
      field?.trim()==="")
   ){
      throw new ApiError(400,"All field is required")
   }
   // user already exists
   const existedUser = await User.findOne({
      // operators
      $or: [ {username} , {email} ]
   })

   if(existedUser){
      throw new ApiError(409,"User with email or username already exists")
   }

   // check for images,check for avatar
   const avatarLocalPath = req.files?.avatar[0]?.path;
   // const coverImageLocalPath = req.files?.coverImage[0]?.path;

   // console.log(req.files);
   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) 
   && req.files.coverImage.length>0){
      coverImageLocalPath=req.files.coverImage[0].path
   }

   if(!avatarLocalPath){
      throw new ApiError(400,"Avatar file is required")
   }

   const avatar=await uploadOnCloudinary(avatarLocalPath);
   const coverImage=await uploadOnCloudinary(coverImageLocalPath);

   if(!avatar){
      throw new ApiError(400,"Avatar file is required")
   }

   // create user object - create entry in db
   const user = await User.create({
      fullName,
      avatar:avatar.url,
      coverImage:coverImage?.url || "",
      email,
      password,
      username:username.toLowerCase()
   })
   // find user in database
   const createdUser=await User.findById(user._id).select(
      "-password -refreshToken"
   )
   if(!createdUser){
      throw new ApiError(500,"Something went wrong while registering the user");
   }
   return res.status(201).json(
      new ApiResponse(200,createdUser,"User registered Successfully")
   )
})
const generateAccessAndRefereshTokens = async(userId)=>{
   try{
      const user=await User.findById(userId);
      const accessToken=user.generateAccessToken();
      const refreshToken=user.generateRefreshToken();

      // save referesh token in database
      user.refreshToken=refreshToken;
      await user.save({validateBeforeSave:false});

      return {accessToken,refreshToken}
   }catch(error){
      throw new ApiError(500,"Something went wrong while generating referesh and access Token");
   }
}
const loginUser = asyncHandler(async(req,res)=>{
     const {email,username,password}=req.body;
     if(!(username || email)){
       throw new ApiError(400,"username or email is required");
     }
     const user = await User.findOne({
         $or:[{username},{email}]
     })
     if(!user){
          throw new ApiError(404,"User does not exist")
     }
     const isPasswordValid=await user.isPasswordCorrect(password);
     if(!isPasswordValid){
          throw new ApiError(401,"Invalid user credentials");
     }

     const {accessToken,refreshToken}=await generateAccessAndRefereshTokens(user._id);

     // jo user line no. 92 pe hai usme refresh token empty hoga
     // so hume usse update krna padega
     const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

     // send cookies
     // esa krne se yeh cookies sirf server se modifiable hongi frontend se nhi kr skte hain
     const options={
      httpOnly:true,
      secure:true
     }

     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",refreshToken,options)
     .json(
        new ApiResponse(
         200,
         {
            user:loggedInUser,accessToken,refreshToken
         },
         "user logged In Successfully"
        )
     )
})

const logoutUser=asyncHandler(async(req,res)=>{
      // req mein user middleware ke through aya hai
      // req mein body,cookie,ab user bhi hai
      await User.findByIdAndUpdate(
         req.user._id,
         {
            $set:{
               refreshToken:undefined
            }
         },
         {
            new:true
         }
      )

      const options={
         httpOnly:true,
         secure:true
      }

      return res
      .status(200)
      .clearCookie("accessToken",options)
      .clearCookie("refreshToken",options)
      .json(
         new ApiResponse(200,{},"User logged out")
      )
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
      const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
      console.log(req.cookies);
      console.log(incomingRefreshToken);
      if(!incomingRefreshToken){
         throw new ApiError(401,"Unauthorized request");
      }

      try{
         const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

         const user=await User.findById(decodedToken?._id);

         if(!user){
            throw new ApiError(401,"Invalid Refresh Token");
         }   

         if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
         }

         const options={
            httpOnly:true,
            secure:true
         }

         const {newaccessToken,newrefreshAccessToken}=await generateAccessAndRefereshTokens(user._id);

         return res
         .status(200)
         .cookie("accessToken",newaccessToken,options)
         .cookie("refreshToken",newrefreshToken,options)
         .json(
            new ApiResponse(
               200,
               {newaccessToken,refreshToken:newrefreshToken},
               "Access token refreshed"
            )
         )
      }catch(error){
         throw new ApiError(401,error?.message || "Invalid refresh token")
      }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
   const {oldPassword,newPassword}=req.body

   const user=await User.findById(req.user?._id)
   const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);

   if(!isPasswordCorrect){
       throw new ApiError(400,"Invalid old Password");
   }

   user.password=newPassword
   await user.save({validateBeforeSave:false})

   return res
   .status(200)
   .json(
      new ApiResponse(200,{},"Password Change successfully")
   )
})

const getCurrentUser=asyncHandler(async(req,res)=>{
  
   return res
   .status(200)
   .json(
      new ApiResponse(200,req.user,"current user fetched successfully")
   );
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
   const {fullName,email}=req.body

   if(!(fullName || email)){
      throw new ApiError(400,"all fields are required")
   }

   const user = await User.findByIdAndUpdate(
         req.user?._id,
         {
         $set:{
            fullName,
            email:email
         }
         },
         {new:true}         // new :true likhne se updated info return hoti hai             
      ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(
      200,
      user,
      "Account details updated successfully"
   )) 
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
   const avatarLocalPath=req.file?.path
   if(!avatarLocalPath){
      throw new ApiError(400,"Avatar file is missing");
   }

   // TODO : delete old image - assignment

   const avatar=await uploadOnCloudinary(avatarLocalPath);

   if(!avatar.url){
      throw new ApiError(400,"Error while uploading in avatar")
   }

   const user=await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            avatar:avatar.url
         }
      },
      {new:true}
   ).select("-password")

   return res
   .status(200)
   .json(
      new ApiResponse(
         200,
         user,
         "avatar image updated successfully"
      )
   )
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
   const coverImageLocalPath=req.file?.path;
   if(!coverImageLocalPath){
      throw new ApiError(400,"coverImage file is missing");
   }

   const coverImage=await uploadOnCloudinary(coverImageLocalPath);

   if(!coverImage.url){
      throw new ApiError(400,"Error while uploading in coverImage");
   }

   const user=await findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            coverImage:coverImage.url
         }
      },
      {new:true}
   ).select("-password")

   return res
   .status(200)
   .json(
      new ApiResponse(
         200,
         user,
         "coverImage updated successfully"
      )
   )
})

export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage
}

// for Registering an user

// get user details from frontend
// validation - not empty
// check if user already exists: username,email
// check for images,check for avatar
// upload them to cloudinary,avatar check
// create user object - create entry in db
// remove password and referesh token field from response
// check for user creation
// return res

// for login an user

// req body -> data
// username or email
// find the user
// password check
// access and referesh token
// send cookie

// logout
// delete refresh token

// https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj