import {asyncHandler} from "../utils/asyncHandler.js"
import {APIError} from "../utils/APIError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {APIResponse} from "../utils/APIResponse.js"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
       const user         = await User.findById(userId)
       const accessToken  = user.generateAccessToken()
       const refreshToken = user.generateRefreshToken()

       user.refreshToken = refreshToken
       await user.save({validateBeforeSave: false})

       return {accessToken, refreshToken}

    } catch (error) {
        throw new APIError(500, "Something went wrong while generating refresh and access tokens")
    }
}

const registerUser = asyncHandler( async (req,res) => {
    //MARK: STEPS
    //get user details from frontend
    //validation - not empty
    //check if user already exists: username, email
    //check for images,check for avatar
    //upload them to cloudinary, check for avatar
    //Create user object - create entry in DB
    //remove password and refresh token field from response
    //check for user creation
    //return response


    const {fullname, email, username, password} = req.body
    //console.log(req.body);

    // if(fullName === ""){
    //     throw new APIError(400, "fullname is required")   ---> NORMIE WAY TO DO THINGS
    // }

    if(
        [fullname, email, username, password].some((field) => field?.trim() === "") // ---> SIGMA WAY TO DO THINGS
    ){
        throw new APIError(400, "All fields are required")
    }

    const existingUser = await User.findOne({
        $or: [{ username },{ email }]
    })
    // console.log(existingUser)

    if(existingUser){
        throw new APIError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {
        console.log("Local path")
        throw new APIError(400, "Avatar file is required(local)")
    }

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length> 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        console.log(avatarLocalPath)
        console.log(avatar)
        throw new APIError(400, "Avatar file is required(cloudinary)")
    }

   const user = await User.create({
        fullname, 
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new APIError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new APIResponse(200, createdUser, "User registered Succesfully")
    )

})


const loginUser = asyncHandler(async(req,res) => {
    //req body -> data
    //username/email
    //find the user
    //password check
    //access and refresh token
    //send cookie

    const {email, username, password} = req.body

    if(!username && !email){
        throw new APIError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new APIError(404,"User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new APIError(401,"Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new APIResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in succesfully"
        )
    )
})

const logOutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new APIResponse(200, {}, "User logged out"))
})

export {
    registerUser,
    loginUser,
    logOutUser
}