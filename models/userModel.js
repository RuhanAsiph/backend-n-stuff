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
	role: {
		type: String,
		enum: ['user', 'guide', 'lead', 'admin'],
		default: 'user'
	},
	password: {
		type: String,
		required: [true, 'Please provide password'],
		minlength: 8,
		select: false
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
	},
	passwordChangedAt: Date  
});

userSchema.pre('save', async function(next){
	//run if the passkey is modified 
	if(!this.isModified('password')) return next();
	 //hash password using bcrypt, will protect against bruteforce attacks
	 this.password = await bcrypt.hash(this.password, 12)
	 this.passwordConfirm = undefined;
	 next();
})

//instance method -> available on the Documents of userSchema
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
	return await bcrypt.compare(candidatePassword, userPassword);

}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
	//.this always points to the current document
	//if passkey changed at proptery exists only then we want to do the camparison
	if(this.passwordChangedAt) {
		const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
		return JWTTimestamp < changedTimestamp
	}

	//if user has not changed the passkey
	return false;

};

const User = mongoose.model('User', userSchema);

module.exports = User;
