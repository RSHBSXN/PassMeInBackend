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
const authy = require("authy")(process.env.API_KEY);

app.use(cors({credentials:true,origin:true}));
app.set("view engine","pug");
app.set("views","./views");
app.use(express.urlencoded({extended:false}));
app.use(express.json());

async function registerUser(req,res){
    //Take email and phonenumber from client
    const email = req.body["email"];
    const phone = req.body["phone"];
    console.log(email,phone);
    //if they dont exist in db then we have to register else we need to throw error
    if(!await User.findByEmail(email) && !await User.findByNumber(phone)){
        
        authy.register_user(email,phone,process.env.COUNTRY_CODE,true,async(err,resp)=>{
            if(err){
                resp.message = err;
                res.status(500).send({status:false,message:err});
            }
            else{
                //createdUser method defined in userSchema
                const result = await User.createUser(email,phone,resp.user.id);
                //result object will have authId
                res.send({status:true,message:result});
            }
        });
    }
    else{
        res.send({status:true,message:'user already exists'});
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
                            //if login approved then create jwt and pass it to the client otherwise send status normally without token
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
async function updateUser(req,res){
    //Find __id of user from jwt first
    const id = jwt.verify(req.header('authorization'),process.env.JWT_PRIVATE_KEY).id;
    //Find the object of user from db
    const user = await User.model.findById(id);
    //Delete the user from authy servers
    authy.delete_user(user.authId,(err,resp)=>{
        if(err){
            res.status(500).send(err);
        }
    });
    //email from db, phone from client
    const email = user.email;
    const phone = req.body['phone'];
    authy.register_user(email,phone,process.env.COUNTRY_CODE,true,async (err,resp)=>{
        if(err)
            res.send(err);
        else{
            //Change authId and phone and send the response to client
            user.authId = resp.user.id;
            user.number = phone;
            console.log(user);
            await user.save();
            res.send(resp);
        }
    });
    
}


//Routes Here
app.post("/login",loginUser);//(params:email or phone)
app.post("/register",registerUser);//(params:email and phone)
app.use("/card",checkAuth);
app.use("/update",checkAuth);
app.post("/update",updateUser);//params(header(authorization):jwt,phone)

//Tune change kiya bc
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
User.display();
//Card.display();
app.listen(port,console.log("listening at port:",port));
