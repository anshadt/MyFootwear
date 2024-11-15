const express=require('express');
const path=require('path');
const session =require('express-session');
const nocache=require('nocache');
const bcrypt=require('bcrypt');
const user = require("./models/userModel");
const userRouter=require('./routes/user');
const adminRouter=require('./routes/admin')
//const otpRouter = require('./routes/otpRoutes/otpRoutes');
const bodyParser = require('body-parser');
const env=require('dotenv').config();
const connectDB = require('./config/database');
const passport=require('./config/passport');
const googleRouter = require('./routes/google');
const cookieParser = require('cookie-parser');

const app=express();
connectDB();

app.set('view engine','ejs');
// app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views',path.join(__dirname,'views'))
app.use(express.static('public'))

app.use(session({
    secret:'yourSecretKey',
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure: false,
        httpOnly:true,
        maxAge:72*60*60*1000
    }
  }));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(nocache());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/',userRouter);
app.use('/admin',adminRouter)
app.use('/auth',googleRouter)


  
app.listen(process.env.PORT,()=>{
    console.log("http://localhost:3000");
    
})



module.exports=app;