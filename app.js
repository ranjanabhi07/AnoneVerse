//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const app = express();

console.log(process.env.API_KEY);

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine","ejs");


/////////// Schema 

const userSchema = new mongoose.Schema ({
    email: String,
    password : String
});


userSchema.plugin(encrypt,{ secret: process.env.SECRET , encryptedFields: ["password"] });

/////////// Model
 
const User = new mongoose.model("User", userSchema);



app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

///////  post and create methods 

app.post("/register", function(req,res){
    // document  created
    const newUser = new User ({
        email: req.body.username,
        password: req.body.password
    })
    // Saved in database
     newUser.save().then(function(){
        res.render("secrets");
     }).catch(function(error){
        console.log(error);
     });
});

app.post("/login", function(req,res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email:username}).then(function(foundUser){
        if(foundUser){
            if(foundUser.password === password){
                res.render("secrets");
            }
        }
    }).catch(function(error){
        console.log(error);
    });
});



app.listen(3000,function(req,res){
    console.log("Server is running on port 3000.")
})
