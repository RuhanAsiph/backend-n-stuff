const User = require('../models/userModel');
const AppError = require('../utils/appError'); 
const jwt = require('jsonwebtoken');


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

	res.status(201).json({
		status: 'success',
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

//snd json web token
const token=" ";
res.status(200).json({
	status: "success",
	token
});
});