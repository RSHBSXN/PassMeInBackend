
//Database connection and importing both models

const port = process.env.PORT;
require("./database/connectMongoose");
const User = require("./database/Schema/userSchema");
const cors =  require("cors");

//const Card = require("./database/Schema/cardSchema");

//include express for routing purposes
const express = require("express");
const app = express();
app.use(cors({credentials:true,origin:true}))
app.set("view engine","pug");
app.set("views","./views");
app.use(express.urlencoded());
app.use(express.json());
async function disp(){
    console.log(await User.find());
}
async function findByEm(em){
    return await User.findOne({email:em});
}
async function findByNum(num){
    return await User.findOne({number:num});
}
async function createUser(email,number,authId){
    const user = new User({
        email:email,
        number:number,
        authId:authId
    });
    await user.save();
}
//Finally include authy for push notification.
const authy = require("authy")(process.env.APIKEY);
//Routes Here
app.post("/login",async (req,res)=>{
    
    let number = req.body.phone;
    // let email = req.body['email'];
    let result = {};
    result = await findByNum(number);
    console.log(result)
    if(!result)
        res.send({status:"user not found"});
    else{
        authy.send_approval_request(result.authId,{message:"click on approve to login"},"","",async(err,resp)=>{
            if(err)
                res.status(404).send({"success":false,"message":"Kuch gdbd hai"})
            else{
                let uuid = resp.approval_request.uuid;
                await setTimeout(()=>{
                    authy.check_approval_status(uuid,(err,resp)=>{
                    if(err)
                        res.status(404).send({"success":false,"message":"Kuch gdbd hai"})
                    else
                        res.status(200).send({"success":true,"message":"Kuch gdbd hai","data":resp.approval_request.status})
                    })
                },30000);
            }
        });//ek bar await hata ke dkehte h
    }
});
app.post("/register",async (req,res)=>{
    const email = req.body["email"];
    const phone = req.body["phone"];
    authy.register_user(email,phone,"+91",true,(err,resp)=>{
        if(err)
            app.send(err);
        else{
            await createUser(email,phone,resp.user.id);
            app.send(resp);

        }
    });
});
//port listening here
app.listen(port,console.log("listening at port",port));