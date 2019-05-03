const mongoose = require("mongoose");
let cardSchema = new mongoose.Schema({
    uid:String,
    url:String,
    email:String,
    password:String,
    domainName:String
});
class Card{
    //CRUD ON CARDS
    async addCard(uid,url,email,pass,dom){
        let card = new Card({
            uid:uid,
            url:url,
            email:email,
            password:pass,
            domainName:dom
        });
        try{
            const result = await card.save();
            return result;
        }
        catch(e){
            return e;
        }
    }
    async findAllCards(uid){
        try{
            const result = await this.model.find({uid:uid});
            return result;
        }
        catch(e){
            return e;
        }
    }
    async updateCard(id,password){
        try{
            const result = await this.model.findByIdAndUpdate(id,{
                $set:{
                    password:password
                }
            },{new:true});
            return result;
        }
        catch(e){
            return e;
        }
    }
    async deleteCard(id){
        try{
            const result = await this.model.findByIdAndRemove(id);
            return result;
        }
        catch(e){
            return e;
        }
    }
}
Card.model = new mongoose.model("Card",cardSchema);