import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import joi from 'joi';
import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { MongoClient } from "mongodb";
import { stripHtml } from "string-strip-html";
dotenv.config();

dayjs.extend(customParseFormat);

const server = express();
const mongoClient = new MongoClient(process.env.MONGO_URI);
const Joi = joi;

const userSchema = joi.object({
    name: joi.string().required()
});
const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid('message','private_message').required(),
});

server.use(cors());
server.use(express.json());

let db;

mongoClient.connect().then(() => {
    db = mongoClient.db('batePapoUol');
});

server.post('/participants', async (req, res) => {
   
    try {
        const user = { name: stripHtml( req.body.name).result.trim()};
        
       /*  await db.collection('users').deleteMany({})
        await db.collection('messages').deleteMany({}) */
        
        const validUser = await db.collection('users').find(user).toArray();
        
        if (validUser.length !== 0){
            res.status(409).send();
            return;
        } 

        const validation = userSchema.validate(user);

        if (validation.error) {
            res.status(422).send();
            return;
        }

        const time =  Date.now();
        const userSaved = {name: user.name, lastStatus: time};
        const message = {from: user.name, to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs(time).format("HH:MM:ss")};
        
        await db.collection('users').insertOne(userSaved);
        await db.collection('messages').insertOne(message);
        
        res.status(201).send();
        
    } catch (error) {
        res.status(500).send('Erro do servidor');
    }
})

server.get('/participants', async (req, res) => {
    try {
        const users = await db.collection('users').find().toArray();
        const usersSent = [];
        users.forEach((user) => {
            usersSent.push({ name: user.name });
        })
        res.status(201).send(usersSent);
    } catch (error) {
        res.status(500).send();
    }
})

server.get('/messages', async (req, res) => {
    try {
        const limit = req.query.limit;
        const user = stripHtml( req.headers.user).result.trim();
        const messages = await db.collection('messages').find().toArray();
        const messagesSent = [];

        if (!limit){

            messages.forEach((message) => {
                if (message.type === 'message' || message.type === 'status'){
                    messagesSent.push({from: message.from, to: message.to, text: message.text, type: message.type, time: message.time});
                } else if (message.to === user || message.from === user){
                    messagesSent.push({from: message.from, to: message.to, text: message.text, type: message.type, time: message.time});
                }
            })

            res.status(201).send(messagesSent);
        }

        const dif = messages.length - limit -1;

        for (let i = messages.length ; i >= dif ; i--){
            if (messages[i]){
                if (messages[i].type === 'message' || messages[i].type === 'status'){
                    messagesSent.unshift({from: messages[i].from, to: messages[i].to, text: messages[i].text, type: messages[i].type, time: messages[i].time});
                } else if (messages[i].to === user || messages[i].from === user){
                    messagesSent.unshift({from: messages[i].from, to: messages[i].to, text: messages[i].text, type: messages[i].type, time: messages[i].time});
                }
            }
        }

        res.status(201).send(messagesSent);
    } catch (error) {
        res.status(500).send();
    }
})

server.post('/messages', async (req, res) => {
    const message = { to: stripHtml( req.body.to ).result.trim(), text: stripHtml( req.body.text ).result.trim(), type: stripHtml( req.body.type ).result.trim()};
    const user = stripHtml( req.headers.user).result.trim();

    const users = await db.collection('users').findOne({ name: user});

    if (users){
        const validation = messageSchema.validate(message);

        if (validation.error) {
            res.status(422).send();
            return;
        }

        const time = Date.now();
        const messageSaved = {from: user, to: message.to, text: message.text, type: message.type, time: dayjs(time).format("HH:MM:ss")};
        
        await db.collection('messages').insertOne(messageSaved);
        
        res.status(201).send();
    }
})

server.post('/status', async (req, res) => {
    try {
        const user = stripHtml( req.headers.user).result.trim();

        const users = await db.collection('users').findOne({ name: user});

        if (!users){
            res.status(404).send();
        }

        const time = Date.now();
        
        const updatedStatus = await db.collection('users').updateOne({ _id: users._id },
            { $set:
            {
                    lastStatus: time,
            }
            })
        
        if (updatedStatus.error) {
            
            res.status(500);
            return;
        }
        res.status(201).send();

    } catch (error) {
        res.status(500).send();
    }
})

setInterval(async () => {
    const users = await db.collection('users').find().toArray();
    const time = Date.now();

    users.forEach(async (user) => {
        if (dayjs(time).diff(dayjs(user.lastStatus)) >= 10000){
            await db.collection('users').deleteOne({ _id: user._id});

            const message = {from: user.name, to: 'Todos', text: 'sai da sala...', type: 'status', time: dayjs(time).format("HH:MM:ss")}

            await db.collection('messages').insertOne(message);
        }
    })
}, 15000);

server.listen(5000, () => {console.log('Server on')})