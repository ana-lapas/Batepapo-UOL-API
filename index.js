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
    type: "private_message"
})
//Configs
app.use(cors())
app.use(express.json())
dotenv.config()

const mongoClient = new MongoClient(process.env.MONGO_URI)
let db;
db = mongoClient.db('databankp13')
const collectionParticipantsOn = db.collection("participantsOn")
const collectionMessagesHistory = db.collection("messagesSaved")

try {
    await mongoClient.connect()
    console.log("MongoDB is connected")
} catch (err) {
    console.log("Erro ao conectar com o MongoDB")
    console.log(err)
}

app.post("/participants", async (req, res) => {
    console.log("entrou no post participants")
    const newUser = req.body
    console.log(newUser)
    const validation = userSchema.validate(newUser)
    console.log(validation, { abortEarly: false })
    if (validation.error) {
        console.log("entrou no erro")
        console.log(validation.error.details)
        const erros = validation.error.details.map((detail) => detail.message);
        res.status(422).send(erros);
    }

    try {
        const checkUser = await collectionParticipantsOn.findOne({ name: newUser })
        if (!checkUser) {
            let hora = dayjs().format('HH:MM:SS')
            console.log(hora)
            await collectionParticipantsOn.insertOne({ name: newUser, lastStatus: Date.now() })
            await collectionMessagesHistory.insertOne({ from: newUser, to: 'Todos', text: 'entra na sala...', type: 'status', time: hora })
            res.sendStatus(201)
        }
    } catch (err) {
        res.sendStatus(409)
    }
})

app.get("/participants", async (req, res) => {
    console.log("Entrou no get participants")
    try {
        const usersOnline = await collectionParticipantsOn.find().toArray()
        res.send(usersOnline)
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }

})
app.post("/messages", async (req, res) => {
    console.log("Entrou no post messages")
    collectionMessagesHistory
})
app.get("/messages", async (req, res) => {
    console.log("Entrou no get messages")
    try {
        const messagesEx = await collectionParticipantsOn.find().toArray()
        res.send(usersOnline)
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})
app.post("/status/:user", async (req, res) => {
    const { user } = req.params
    try {
        await collectionParticipantsOn.findOne({ name: user })
        if (!user) {
            res.sendStatus(404)
            return;
        }
        await collectionParticipantsOn.updateOne({ 
			name: user
		}, { $currentDate: {lastStatus: true,  "lastStatus": { $type: "timestamp" } }})
				
		res.sendStatus(200)
    } catch {
        console.log(err)
        res.sendStatus(404)
    }
})
app.listen(5000, () => console.log('Server running in port: 5000'))