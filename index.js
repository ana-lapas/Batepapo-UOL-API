import express  from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"
import joi from "joi"
const app = express()

const userSchema = joi.object({
    name: joi.string().required().min(1)
})
const messageSchema = joi.object({
    to: joi.string().required().min(1),
    text: joi.string().required().min(1),
    type: "private_message"
})
//Configs
app.use(cors())
app.use(express.json())
dotenv.config()
const mongoClient = new MongoClient(process.env.MONGO_URI)
let db;

mongoClient
.connect()
.then(()=>{
    db = mongoClient.db('participants')
}
).catch(err => console.log(err))

/*
Ex participante -> {name: 'João', lastStatus: 12313123} // O conteúdo do lastStatus será explicado nos próximos requisitos
 Ex Mensagem -> {from: 'João', to: 'Todos', text: 'oi galera', type: 'message', time: '20:04:37'}
*/
app.post("/participants", (req, res) => {
    console.log(req.body)
    let user = req.body.name
    if(user.length === 0){
        res.sendStatus(422)
        return
    } else if (user){}
    else{
        db.collection("participants").insert(
            {name: user, lastStatus: Date.now()}
        )
    }
})
app.get("/participants", (req, res) => {
    
    db.collection('participantsOn')
    .find()
    .toArray()
    .then((participantsOn) => {
        console.log(participantsOn)
        res.send("ok")
    })
    .catch(err =>
        res.sendStatus(500))
    
    return
})
app.listen(5000, () => console.log("Server running in port: 5000"))