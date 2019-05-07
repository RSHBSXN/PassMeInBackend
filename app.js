require("dotenv").config();
const jwt = require("jsonwebtoken");
const checkAuth = require("./middlewares/jwt");
const cors =  require("cors");
const port = process.env.PORT;
//Database connection and importing both models
require("./database/connectMongoose");
const User = require("./database/Schema/userSchema");
const Card = require("./database/Schema/cardSchema");

//include express for routing purposes
const express = require("express");
const app = express();
app.use(cors({credentials:true,origin:true}));
app.set("view engine","pug");
app.set("views","./views");
app.use(express.urlencoded({extended:false}));
app.use(express.json());

async function registerUser(req,res){
    const email = req.body["email"];
    const phone = req.body["phone"];
    console.log(email,phone);
    if(!await User.findByEmail(email) && !await User.findByNumber(phone)){
        authy.register_user(email,phone,process.env.COUNTRY_CODE,true,async(err,resp)=>{
            if(err){
                resp.message = err;
                res.status(500).send({status:false,message:err});
            }
            else{
                const result = await User.createUser(email,phone,resp.user.id);
                res.send({status:"1000",message:result});
            }
        });
    }
    else{
        res.send({status:"1002",message:'user already exists'});
    }
}
async function loginUser(req,res){
    let number = req.body["phone"];
    let email = req.body['email'];
    let result = {};
    console.log(number,email)
    if(number != null){
        result = await User.findByNumber(number)
    }
    else if(email != null){
        result = await User.findByEmail(email)
    }
    console.log(result);
    if(!result)
        res.send({status:false,message:"User not found"});
    else{
        authy.send_approval_request(result.authId,{message:"click on approve to login"},"","",(err,resp)=>{
            if(err)
                res.status(500).send(err)
            else{
                let uuid = resp.approval_request.uuid;
                setTimeout(()=>{
                    authy.check_approval_status(uuid,(err,resp)=>{
                    if(err)
                        res.status(500).send({status:false,message:"Kuch gdbd hai"})
                    else{
                        if(resp.approval_request.status == "approved"){
                            token = jwt.sign({id:result._id},process.env.JWT_PRIVATE_KEY);
                            res.status(200).send({status:true,message:resp.approval_request.status,token:token});
                        }
                        else
                            res.status(200).send({status:true,message:resp.approval_request.status})
                        }
                    })
                },20000);
            }
        });
    }
}
//Finally include authy for push notification.
const authy = require("authy")(process.env.API_KEY);
//Routes Here
app.post("/login",loginUser);
app.post("/register",registerUser);
app.use("/card",checkAuth);

app.post("/card/:type",async(req,res)=>{
    const uid = jwt.verify(req.header("authorization"),process.env.JWT_PRIVATE_KEY);
    const type = req.params.type
    switch(type){
        case 'fetch':
            res.send(await Card.findAllCards(uid.id));
            break;
        case 'add':
            if(req.body['url'] && req.body['email'] && req.body['password'] && req.body['domain'])
                res.send(await Card.addCard(uid.id,req.body['url'],req.body['email'],req.body['password'],req.body['domain']));
            else
                res.send({status:"Incomplete fields"});
            break;
        case 'update':
            res.send(await Card.updateCard(req.body["id"],req.body['card']));
            break;
        case 'deletecard':
            res.send(await Card.deleteCard(req.body['id']));
            break;
        default:
            res.status(404).send("NOT FOUND");
    }
})
//User.display();
//Card.display();
app.listen(port,console.log("listening at port:",port));
