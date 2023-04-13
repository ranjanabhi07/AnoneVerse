//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine","ejs");

mongoose.connect("mongodb://127.0.0.1:27017/userDB");



// set up session 
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

// initialize passport
app.use(passport.initialize());
app.use(passport.session()); 


/////////// Schema 

const userSchema = new mongoose.Schema ({
    email: String,
    password : String
});

userSchema.plugin(passportLocalMongoose);
/////////// Model
 
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    } else{
        res.redirect("/login");
    }
});

app.get("/logout", function(req,res){
    req.logout(function(error){
        console.log(error);
    });
    res.redirect("/");
});


app.post("/register", function(req,res){
    User.register({username: req.body.username}, req.body.password).then(function(user){
        passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
        })
    }).catch(function(error){
        console.log(error);
        res.redirect("/register");
    });
});

app.post("/login", function(req,res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(error){
        if(error){
            console.log(error);
        } else {
            passport.authenticate('local')(req, res, function(){
                res.redirect("/secrets");
            });
        }

    });
});



app.listen(3000,function(req,res){
    console.log("Server is running on port 3000.")
})
 
