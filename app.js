const express = require("express");
const server = express();
//Routes
server.get("/",(req,res)=>{
    res.send("CONNECTED");
})


server.listen(200,console.log("Running Server"));