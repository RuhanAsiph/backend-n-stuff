const User = require('../models/userModel');
const AppError = require('../utils/appError'); 
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const sendEmail = require('../utils/email');

const signToken = id => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN
	})
}
const catchAsync = fn => {
	return (req, res, next) => {
		fn(req, res, next).catch(next);
	}
	
}
exports.signup = catchAsync(async (req, res, next) => {
	const newUser = await User.create({
		name: req.body.name,
		email: req.body.email, 
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm
	});

	const token = signToken(newUser._id); 

	res.status(201).json({
		status: 'success',
		token,
		data: {
			user: newUser
		}
	})
})


//implenet login functionality + sending jwt tokens
exports.login = catchAsync (async (req, res, next) => {
	const { email, password } = req.body;
//check if email and password exists 
if (!email || !password) {
	next(new AppError('Please provide email and password', 400));
}

//check if user exists and pasword is correct
const user =  await User.findOne({ email }).select('+password');
// { 'passkey' } === "hashedpassword" --- implemnting it in Models 
//const correct = await user.correctPassword(password, user.password);
if (!user || !await user.correctPassword(password, user.password)){
	return next(new AppError('Incorrect email or password', 401));
};

//snd json web token
const token = signToken(user._id);
res.status(200).json({
	status: "success",
	token
});
});

exports.protect = catchAsync( async (req, res, next) => {
	let token;
	//check if the token exists
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
		token = req.headers.authorization.split(' ')[1];
	}
	if (!token) {
		return next(new AppError('Your not logged in! login to get access', 401));
	}
	// verify the token
	const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
	
	//check if the user still exists 
	const freshUser = await User.findById(decoded.id);
	if(!freshUser) {
		return next(new AppError('token no longer exists', 401));
	}

	//check if user changed password after the token was issued
	if(freshUser.changedPasswordAfter(decoded.iat)){
		return next( new AppError('User recently changed password! Please log in again', 401))
	}
	req.user = freshUser;
	next()
});

//passing arg into the middleware func
//implementation - create the wrapper func which will return the middleware function 
//in reality middleware functions do not accept arguments
exports.restrictTo = (...roles) => {
	return (req, res, next) => {
		//roles is an array
		if(!roles.includes(req.user.role)) {
			return next(new AppError('you do not have permission to perform this action', 403));
		}
		next();
	}
}  


//implement forgot passkey feature

exports.forgotPassword = catchAsync(async(req, res, next) => {
	const user = await User.findOne({ email: req.body.email });
	
	if (!user) {
		return next(new AppError('There is no user with that email address', 404))
	}

	const resetToken = user.createPasswordResetToken();
	await user.save({ validateBeforeSave: false });


//send to users email
const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
const message = `Forgot your passkey submit a patch request with your new password and password confirm to: ${resetURL}.\n 
If you didnt forget you password please igonore this email`

try {
	await sendEmail({
		email: user.email,
		subject: 'Your passsword reset token(valid for 10min)',
		message
	});

	res.status(200).json({
		status: "success",
		message: "token sent to email!"
	})
}
catch (err) {
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;
	await user.save({ validateBeforeSave: false });

	return next(new AppError('There was an error sending the email. Try again later', 500))
}
});

exports.resetPassword = (req, res, next) => {}

