import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"
import joi from "joi"
import dayjs from "dayjs"
const app = express()

const userSchema = joi.object({
    name: joi.string().required().min(1)
})
const messageSchema = joi.object({
    to: joi.string().required().min(3),
    text: joi.string().required().min(3),
    type: joi.string().valid("message", "private_message").required()
})
//Configs
app.use(cors())
app.use(express.json())
dotenv.config()
const mongoClient = new MongoClient(process.env.MONGO_URI)

try {
    await mongoClient.connect()
} catch (err) {
    console.log(err.message)
}
let db;
db = mongoClient.db('databankp13')
const collectionParticipantsOn = db.collection("participantsOn")
const collectionMessagesHistory = db.collection("messagesSaved")
app.post("/participants", async (req, res) => {
    const userName = req.body
    const validation = userSchema.validate(userName, { abortEarly: false })
    if (validation.error) {
        const erros = validation.error.details.map((detail) => detail.message);
        res.status(422).send(erros);
    }

    try {
        const checkUser = await collectionParticipantsOn.findOne({name: userName.name})
        if (!checkUser) {
            let hora = dayjs().format('HH:mm:ss')
            await collectionParticipantsOn.insertOne({name: userName.name, lastStatus: Date.now()})
            await collectionMessagesHistory.insertOne({ from: userName.name, to: 'Todos', text: 'entra na sala...', type: 'status', time: hora })
            res.sendStatus(201)
        }
        res.sendStatus(409)
    } catch (err) {
        res.sendStatus(500)
    }
})

app.get("/participants", async (req, res) => {
    try {
        const usersOnline = await collectionParticipantsOn.find().toArray()
        res.send(usersOnline)
    } catch (err) {
        res.sendStatus(500)
    }

})

app.post("/messages", async (req, res) => {
    const newMessage = req.body
    const validationM = messageSchema.validate(newMessage, { abortEarly: false })
    if (validationM.error) {
        const erros = validationM.error.details.map((detail) => detail.message);
        res.status(422).send(erros);
    }    
    
    try {
        const checkFrom = req.headers.user
        const checkUser = await collectionParticipantsOn.findOne({checkFrom})
        if (!checkUser) {
            res.sendStatus(404)
        } 
        let hora = dayjs().format('HH:mm:ss')
        await collectionMessagesHistory.insertOne({ from: checkFrom, to: newMessage.to, text: newMessage.text, type: newMessage.message, time: hora })
        res.sendStatus(201)
    } catch (err) {
        res.sendStatus(500)
    }    
})

app.get("/messages", async (req, res) => {
    const limit = parseInt(req.query.limit);
    try {
        const messagesEx = await collectionMessagesHistory.find().toArray()
        res.send(messagesEx)
    } catch (err) {
        res.sendStatus(500)
    }
})

app.post("/status", async (req, res) => {
    const userToBeUpdated = req.headers.user
    try {
        await collectionParticipantsOn.findOne({ name: userToBeUpdated }).toArray()
        if (!userToBeUpdated) {
            res.sendStatus(404)
            return;
        }
        
        await collectionParticipantsOn.updateOne({
            name: userToBeUpdated
        }, { $set: {lastStatus: Date.now()} })
        res.sendStatus(200)
    } catch {
        res.sendStatus(404)
    }
})

/*setInterval( ,1500)*/
app.listen(5000, () => console.log('Server running in port: 5000'))