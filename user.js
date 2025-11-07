const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/miniproject");

let userSchema = mongoose.Schema({
    email : String,
    password : String,
    username : String,
    age : Number,
    name : String,
    posts : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "post"
        }
    ]
});

module.exports = mongoose.model('user',userSchema);