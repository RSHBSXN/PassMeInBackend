const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    idForn:String,
    number:String,
    authId:String
});
class User{
    static async findByEmail(email){
        try{
            const result = await this.model.findOne({email:email});
            return result;
        }
        catch(e){
            return e;
        }
    }
    static async findByNumber(number){
        try{
            const result = await this.model.findOne({number:number});
            return result;
        }
        catch(e){
            return e;
        }
    }
    static async createUser(name,email,number,authId){
        const user = new this.model({
            name:name,
            email:email,
            number:number,
            authId:authId
        });
        try{
            const status =  await user.save();
            return status;
        }
        catch(e){
            return e;
        }
    }
    static async display(){
        console.log(await this.model.find());
        // await this.model.find();
    }
}
User.model = mongoose.model("User",userSchema);
module.exports = User;