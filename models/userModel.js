const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
// create schema
const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Please tell us your name']
	},
	email: {
		type: String,
		required: [true, 'Please provide your email'],
		unique: true,
		lowercase: true,
		validate: [validator.isEmail, 'Please provide an email']
	},
	password: {
		type: String,
		required: [true, 'Please provide password'],
		minlength: 8
	},
	passwordConfirm: {
		type: String,
		required: [true, 'please confirm your password'],
		validate: {
			//work on create and save, not in other methods
			validator: function (el){
				return el === this.password;
			}
		}
	}
});

userSchema.pre('save', async function(next){
	//run if the passkey is modified 
	if(!this.isModified('password')) return next();
	 //hash password using bcrypt, will protect against bruteforce attacks
	 this.password = await bcrypt.hash(this.password, 12)
	 this.passwordConfirm = undefined;
	 next();
})

const User = mongoose.model('User', userSchema);

module.exports = User;
