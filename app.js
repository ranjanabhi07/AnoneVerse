//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

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
    email: String ,
    password : String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
/////////// Model
 
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, name: user.displayName });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));


app.get("/",function(req,res){
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
  );

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });  


app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.get("/secrets",function(req,res){
    User.find({"secret": {$ne: null}}).then(function(foundUser){
        if(foundUser){
            res.render("secrets", {usersWithSecrets: foundUser})
        }
    }).catch(function(error){
        console.log(error);
    })
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    } else{
        res.redirect("/login");
    }
});

app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;

    console.log(req.user);

    User.findById(req.user.id).then(function(foundUser){
        if(foundUser){
            foundUser.secret = submittedSecret;
            foundUser.save().then(function(){
                res.redirect("/secrets")
            }).catch(function(error){
                console.log(error);
            });
        }
    }).catch(function(error){
        console.log(error);
    });
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