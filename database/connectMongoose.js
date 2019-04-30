const cors = require("cors");
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/DB",{useNewUrlParser:true})
.then(()=>{console.log("Connected")})
.catch(err=>{console.log("Could not connect",err)});
