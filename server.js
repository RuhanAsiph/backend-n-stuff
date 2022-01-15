const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const ejs = require("ejs");
//test user routing 
const authController = require('./controllers/authController');
//initialize config file 
dotenv.config({path: './config.env'})

app.set("view engine", "ejs");

app.use(express.urlencoded({extended: true}));
app.use(express.json()) // To parse the incoming requests with JSON payloads

//serve static files 
app.use(express.static(`${__dirname}/frontend`));

//mongodb database
const DB = process.env.DATABASE.replace(
    '<PASSWORD>', 
    process.env.DATABASE_PASSWORD
);

//cosmos-db database
const dbTwo = process.env.databaseTwo.replace(
    '<primary_master_key>', process.env.databaseTwoKey
); 

//mopngoose 
mongoose.connect(DB, { useNewUrlParser: true, useUnifiedTopology: true}).then(con => {
    console.log('db con successful');
});

//create schema 
const productsSchema = {
    name: {
        type: String,
        required: true
    },
    number: String,
    email: String
}

//create model 
const Product = mongoose.model("Product", productsSchema);

//display static pages 
app.get('/', (req,res) => {
    Product.find({}, function(err, products) {
        res.render('index', {
          productsList: products
        })
    });
});
app.get('/appointments', (req,res) => {
    Product.find({}, function(err, products) {
        res.render('appointments', {
          productsList: products
        })
    });
    
});
app.get('/schedule', (req,res) => {
    res.sendFile(__dirname + "/frontend/schedule.html");
});

//api
//handler func
const createAppointment = async (req, res) => {
    try {
    // let newProd = new Product({
    //     name: req.body.name,
    //     number: req.body.number,
    //     email: req.body.email
    // })
    // newProd.save();
    // res.redirect('/appointments');

    const newProd = await Product.create(req.body);
    res.redirect('/appointments');
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: "invalid data sent"
        })
    }
};

//api for fetching tours
const getAppointments = async (req, res) => {
    try {
        const products = await Product.find()
        res.status(200).json({
            status: "success",
            data: {
                products
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: "invalid data sent"
        })
    }
};

const getAppointment = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        res.status(200).json({
            status: "success",
            data: {
                product
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: "invalid data sent"
        })
    }
};

const catchAsync = fn => {
	return (req, res, next) => {
		fn(req, res, next).catch(next);
	}
}

const deleteAppointment = catchAsync(async (req, res, next) => {
    const product = await Product.findByIdAndDelete(req.params.id);
  
    if (!product) {
      return next(new AppError('No appointment found with that ID', 404));
    }
  
    res.status(204).json({
      status: 'success',
      data: null
    });
  });

//app.post 
//app.post('/api/v1/appointments', createAppointment);

//routes
//test user routing
const userRouter = express.Router();
userRouter.route('/signup').post(authController.signup);
userRouter.route('/login').post(authController.login);
app.use('/api/v1/users', userRouter);
//login router


//implement product router 
const productRouter = express.Router();
productRouter.route('/').post(createAppointment);

//not using this route in the final project yet 
productRouter.route('/').get(authController.protect, getAppointments);
productRouter.route('/:id').get(getAppointment).delete(authController.protect, authController.restrictTo('admin'), deleteAppointment);

app.use('/api/v1/appointments', productRouter);


//start
const port = 4000
app.listen(port, function(){
    console.log(`Server started at ${port}`);
});
 


