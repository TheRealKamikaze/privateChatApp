const express = require('express');
const socket = require('socket.io');
const app = express();
let bodyparser      = require("body-parser"),
    mongoose        = require("mongoose"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    User            = require("./models/user"),
    methodOverride  = require("method-override");

mongoose.connect('mongodb+srv://tarun:hGORlyhChSqBD81J@cluster0-a0vpp.mongodb.net/chat?retryWrites=true&w=majority',{useNewUrlParser: true, useUnifiedTopology: true})
app.use(express.static(__dirname+'public'));
app.use(bodyparser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.set("view engine","ejs");
app.use(require("express-session")({
    secret: "Oliver Queen is the Green Arrow",
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
    res.locals.currentUser=req.user;
    next();
})

let server = app.listen(process.env.IP,process.env.PORT,()=>{
  console.log('Web server is listening!!');
})

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register",function(req,res){
    User.register(new User({username: req.body.username}),req.body.password, function(err,User){
       if(err){
        console.log(err);
        return res.render("register");
       }
       else{
           passport.authenticate("local")(req,res,function(){
              res.redirect("/chat")
           })
       }
    });
})

app.get("/login",function(req,res){
            res.render("login");
});

app.post("/login",passport.authenticate("local",{
        successRedirect: "/chat",
        failureRedirect: "/login"
}
        ),function(req,res){
})

app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/chat");
})

app.get("/",function(req,res){
    res.render("index");
});
app.get('/chat',isLoggedIn,function(req,res){
  res.render('chat');
})

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

app.get('/api/user_data',isLoggedIn, function(req, res) {

            if (req.user === undefined) {
                // The user is not logged in
                res.json({});
            } else {
                res.json({
                    username: req.user.username
                });
            }
        });

let io = socket(server);
let users = [];
io.on('connect',(socket)=>{
  console.log('Connected!!',socket.id);
  io.emit('send-username');
  socket.on('username',function(data){
    console.log(socket.id+" "+data);
    let pos = users.findIndex((user)=>user.username === data)
    if (pos===-1) {
      users.push({username : data, socketId: socket.id});
    }else{
      users[pos].socketId=socket.id;
    }
    console.log(users);
  })

  socket.on('chatMessage',(data)=>{
    let index=0;
    let to=[];
    while(data.message.indexOf('@',index)!==-1){
      let pos = data.message.indexOf('@',index);
      let endPos=data.message.indexOf(' ',pos);
      // console.log(pos,endPos);
      let str = data.message.substr(pos+1,endPos-pos-1);
      to.push(str);
      index=data.message.indexOf(' ',pos);
    }
    let toUsers=[];
    to.forEach((toPerson)=>{
      toUsers.push(users.find((user)=>user.username===toPerson));
    })
    toUsers.forEach((user)=>{socket.broadcast.to(user.socketId).emit('message', data)})
  })
})
