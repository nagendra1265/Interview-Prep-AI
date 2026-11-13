const userModel= require("../models/user.model")
const bcrypt= require("bcryptjs")
const jwt= require("jsonwebtoken")

const tokenBlackListModel=require("../models/blacklist.model")


/**
 * 
 * @name registerUserController{*} req 
 * @description register a new user, expects a user name, email and password in the required params
 * @access public
 */

async function registerUserController( req, res) {
    const {username, email, password} =req.body

    if(!username || !email || !password){
        return res.status(400).json({
            message: "Please provide username, email, password"
        })
    }

    const isUsernameAlreadyExists =await userModel.findOne({username})
    const isEmailAlreadyExists =await userModel.findOne({email})
    if(isUsernameAlreadyExists){
        return res.status(400).json({
        message:"user name is already taken"
        })
    }
    if(isEmailAlreadyExists){
        return res.status(400).json({
        message:"There is an existing account with this email"
        })
    }

    const hash= await bcrypt.hash(password, 10)

    const user= await userModel.create({
        username,
        email,
        password:hash,
    })

    const token=jwt.sign(
        {id :user._id, username: user.username},
        process.env.JWT_SECRET,
        {expiresIn: "1d"}
    )

    res.cookie("token", token)

    res.status(201).json({
        message:"user registered successfully",
        user:{
            id:user._id,
            username: user.username,
            email: user.email
        }
    })

}


/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access public
 */
async function loginUserController(req, res){
    const {email, password}=req.body

    const user= await userModel.findOne({email})
    if(!user){
        return res.status(400).json({
            message:"Invalid email"
        })
    }

    const  isPasswordValid= await bcrypt.compare(password, user.password)
    if(!isPasswordValid){
        return res.status(400).json({
            message:"Invalid password"
        })
    }

    const token=jwt.sign(
        {id :user._id, username: user.username},
        process.env.JWT_SECRET,
        {expiresIn: "1d"}
    )

    res.cookie("token", token)
    res.status(200).json({
        message:"User loggedIn successfully",
        token,
        user: {
            id :user._id,
            username: user.username,
            email: user.email
        }
    })
}

/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token to the blacklist
 * @access public
 */
async function logoutUserController(req, res){
    const token= req.cookies.token

    if(token){
        //add token to balcklist
        await tokenBlackListModel.create({ token })
    }

    res.clearCookie("token")
    res.status(200).json({
        message: "User logged out successfully"
    })
} 

/**
 * @name getMeUserController
 * @description get the cuurent logged in user details
 * @access private
 */

async function getMeUserController(req, res){

    const user= await userModel.findById(req.user.id)
    
    res.status(200).json({
        message: "user details fetched successfully",
        user:{
            id: user._id,
            username: user.username,
            email:user.email
        }
    })

}


module.exports= {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeUserController
}
