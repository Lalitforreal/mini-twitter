const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt');
const userModel = require('./models/user');
const postModel = require('./models/post');
const jwt = require('jsonwebtoken');

//after multer
const upload = require("./config/multerConfig");

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(express.static(path.join(__dirname, "public")));
//cookies and all
app.use(cookieParser());

app.get('/', function(req,res){
    res.render("index");
})

app.post('/register', async function(req,res){
    let {email, username, name , age, password} = req.body;
    //check if user is already registered
    let user = await userModel.findOne({email});
    if(user) return res.status(500).send("User already registered");

    bcrypt.genSalt(10 , function(err,salt){
        bcrypt.hash(req.body.password, salt , async function(err,hash){
            let user = await userModel.create({
                name : name,
                email : email,
                username : username,
                password : hash,
                age: age
            });
            let token = jwt.sign({email : email, userid : user._id}, "secretKey"); //it will store these two things
            res.cookie("token", token); //when you see the register route cookie you'll see
            res.redirect('/profile');
        } );
    });
})



app.get('/login', function(req,res){
    res.render('login');
})
//after multer there is also an option to update profilepic so make route 

app.get('/profile/upload', function(req,res){
    res.render("pfp.ejs");
})

// debug step
// app.post('/upload', upload.single("image"),function(req,res){
//     console.log(req.file);
// })now we know name comes in req.file.filename

app.post("/upload",upload.single("image"),isLoggedIn, async function(req,res){
    //find user using loggedin middle ware then update the profilepic name
    let user = await userModel.findOne({email : req.user.email});
    user.profilepic = req.file.filename;
    await user.save();
    res.redirect('/profile');
})

app.post('/login', async function(req,res){
    let user = await userModel.findOne({email : req.body.email});
    if(!user){
        res.redirect('/login')
        return res.status(500).send("Something went wrong");
    }

    bcrypt.compare(req.body.password, user.password, function(err,result){
        if(result){
            //make token 
            let token = jwt.sign({email : user.email, userid : user._id}, "secretKey");
            res.cookie("token", token);
            res.status(200).redirect("profile");
        }else{
            res.redirect('/login');
        }
    })
})

app.get('/logout', function(req,res){
    res.cookie("token", "");
    // res.send("logged out");
    res.redirect("/login");
});

//protected route
app.get('/profile',isLoggedIn, async function(req,res){
    let user = await userModel.findOne({email : req.user.email}).populate("posts");
    //populate posts field so you get content inside the posts array instead of jus tIDS
    res.render("profile", {user}); //after populate the user also contains the content
    // res.render('profile');
})

//when the user wants to create a post
app.post('/post', isLoggedIn, async function(req,res){ 
    let body = req.body; //isLogged in used for teh ability to get user data
    let user = await userModel.findOne({email : req.user.email});
    let {content} = req.body;
    let post = await postModel.create({
        user : user._id,
        content : req.body.content
    })
    
    user.posts.push(post);
    await user.save(); 
    res.redirect('/profile');
})

app.get('/like/:id',isLoggedIn, async function(req,res){
    let post = await postModel.findOne({_id : req.params.id}).populate("user");
    console.log("Post likes:", post.likes);
    console.log("User ID:", req.user.userid);
    if(post.likes.indexOf(req.user.userid) === -1) { // post ke like wali array me agar ye id nahi hai
        post.likes.push(req.user.userid);
    }else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1); // if like exits splice/remove 1 like of that user
    }
    await post.save();
    res.redirect('/profile');
})

app.get('/edit/:id',isLoggedIn, async function(req,res){
    let user = await postModel.findOne({_id : req.params.id}).populate("user");
    res.render("edit", {user});
})

app.post('/update/:id',isLoggedIn, async function(req,res){
    let user = await postModel.findOneAndUpdate({_id : req.params.id}, {content : req.body.content});
    res.redirect("/profile");
})
app.get('/delete/:id',isLoggedIn, async function(req,res){
    let post = await postModel.findOneAndDelete({_id : req.params.id});
    res.redirect('/profile');
})

//now you need middleware for protected routes 
function isLoggedIn(req,res,next){
    if(req.cookies.token === ""){ //here check the token
        res.send("You must be logged in to access this");
    }else{
        let data = jwt.verify(req.cookies.token , "secretKey");
        req.user = data; //did this step to give the user data to where this middleware is being used (for eg profile)
        next();
    }
}



app.listen(3000);


