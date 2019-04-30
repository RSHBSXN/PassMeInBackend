const mongoose = require("mongoose");
let userSchema = new mongoose.Schema({
    email:String,
    number:String,
    authId:String
});
const User = mongoose.model("User",userSchema);
module.exports = User;