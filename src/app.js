import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from "mongodb";
import dayjs from 'dayjs';


const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

const newUserSchema = joi.object({
    name: joi.string().required().min(3),
});

const newMessageSchema = joi.object({
    from: joi.string().required(),
    to: joi.string().required().min(3),
    text: joi.string().required().min(1),
    type: joi.string().required().valid("message", "private_message"),
    time: joi.string(),
});

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect()
    .then(() => {
        db = mongoClient.db();
        console.log("MongoClient is connected")
    })
    .catch(() => {
        console.log("MongoClient is not connected")
    });

const participantsOnCollection = db.collection("participants");
const messagesSentCollection = db.collection("messages");

app.get('/participants', async (req, res) => {
    try {
        const usersOn = await participantsOnCollection.find().toArray();
        if (!usersOn) {
            return res.sendStatus(404);
        }
        return res.send(usersOn);
    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
});

app.get('/messages', async (req, res) => {
    const limit = parseInt(req.query.limit);
    const { user } = req.headers;

    try {
        const messagesEx = await messagesSentCollection.find({
            $or: [
                { from: user },
                { to: { $in: [user, "Todos"] } },
                { type: "message" },
            ],
        }).limit(limit).toArray();

        if (messagesEx.length === 0) {
            return res.status(404).send("No message found");
        }
        return res.send(messagesEx);
    }
    catch (err) {
        return res.sendStatus(500);
    }
});

app.post('/participants', async (req, res) => {
    const newUser = req.body;
    const validation = newUserSchema.validate({ name: newUser.name }, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }

    try {
        const checkUser = await participantsOnCollection.findOne({ name: userName.name });
        if (checkUser) {
            return res.sendStatus(409);
        }
        let hora = dayjs().format('HH:mm:ss');
        await participantsOnCollection.insertOne({ name: userName.name, lastStatus: Date.now() });
        await messagesSentCollection.insertOne({
            from: userName.name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: hora
        });
        return res.sendStatus(201);

    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.post('/messages', async (req, res) => {
    const { user } = req.headers;
    const newMessage = {
        from: user,
        to: req.body.to,
        text: req.body.text,
        type: req.body.type,
        time: dayjs().format("HH:mm:ss")
    };

    try {
        const validationM = newMessageSchema.validate(newMessage, { abortEarly: false });
        if (validationM.error) {
            const erros = validationM.error.details.map((detail) => detail.message);
            return res.status(422).send(erros);
        };

        await messagesSentCollection.insertOne({ newMessage });
        return res.sendStatus(201);
    } catch (err) {
        return res.sendStatus(500);
    }
});

app.post('/status', async (req, res) => {
    const { user } = req.headers;
    try {
        const existingUser = await participantsOnCollection.findOne({ name: user });
            if (!existingUser) {
                return res.sendStatus(404);
            }
        await participantsOnCollection.updateOne({ name: user },
            { $set: { lastStatus: Date.now() } });
        return res.sendStatus(200)
    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
})
//Remover os participantes ainda;
/*setInterval( ,1500)*/

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));