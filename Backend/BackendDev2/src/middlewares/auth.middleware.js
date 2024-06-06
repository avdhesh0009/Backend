import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/aysncHandler.js";
import jwt from "jsonwebtoken"

// agar res khali ho toh _ bhi likh skte hain
export const verifyJWT = asyncHandler(async(req,res,next)=>{
    // req aur response dono ke pass cookie ka access hai
    // humne app.js mein dia hua hai
   try{
        const token =req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        // console.log(req.cookies);
        if(!token){
            throw new ApiError(401,"Unauthorized request ")
        }

        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

        const user=await User.findById(decodedToken?._id).select("-password -refreshToken");

        if(!user){
            // TODO : discuss about frontend
            throw new ApiError(401,"Invalid Access Token")
        }
        // req ek object hai usme user ko add kr rhe hain
        req.user=user;
        next();
   }catch(error){
        throw new ApiError(401,error.message || "Invalid access token")
   }
})