import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import joi from 'joi';
import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { MongoClient } from "mongodb";
dotenv.config();

dayjs.extend(customParseFormat);

const server = express();
const mongoClient = new MongoClient(process.env.MONGO_URI);
const Joi = joi;
const userSchema = joi.object({
    name: joi.string().required()
});

server.use(cors());
server.use(express.json());

let db;

mongoClient.connect().then(() => {
    db = mongoClient.db('batePapoUol');
});

server.post('/participants', async (req, res) => {
    /* const user = req.body;
    const validUser = await db.collection('users').deleteMany({});

    console.log(validUser) */
    
    try {
        const user = await req.body;
        const validUser = await db.collection('users').find(user).toArray();
        
        if (validUser.length !== 0){
            res.status(409).send('O nome já está sendo usado');
            return;
        } 

        const validation = userSchema.validate(user);

        if (validation.error) {
            res.status(422).send('Nome inválido');
            return;
        }

        const time =  Date.now();
        const userSaved = {name: user.name, lastStatus: time};
        const message = {from: user.name, to: 'Todos', text: 'entra na sala...', type: 'message', time: dayjs(time).format("HH:MM:ss")};
        
        await db.collection('users').insertOne(userSaved);
        await db.collection('messages').insertOne(message);
        
        res.status(201);
        
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
        res.status(500).send('Erro do servidor');
    }
})

server.get('/messages', async (req, res) => {
    try {
        const limit = await req.query.limit;
        const user = await req.headers.user;
        const messages = await db.collection('messages').find().toArray();
        const messagesSent = [];

        if (!limit){

            messages.forEach((message) => {
                console.log(message.to);
                if (message.type === 'message' || message.type === 'status'){
                    messagesSent.push({from: message.from, to: message.to, text: message.text, type: message.type, time: message.time});
                } else if (message.to === user){
                    messagesSent.push({from: message.from, to: message.to, text: message.text, type: message.type, time: message.time});
                }
            })

            res.status(201).send(messagesSent);
            return;
        }

        const dif = messages.length - limit -1;

        for (let i = messages.length ; i >= dif ; i--){
            if (messages[i]){
                if (messages[i].type === 'message' || messages[i].type === 'status'){
                    messagesSent.unshift({from: messages[i].from, to: messages[i].to, text: messages[i].text, type: messages[i].type, time: messages[i].time});
                } else if (messages[i].to === user){
                    messagesSent.unshift({from: messages[i].from, to: messages[i].to, text: messages[i].text, type: messages[i].type, time: messages[i].time});
                }
            }
        }

        res.status(201).send(messagesSent);
    } catch (error) {
        res.status(500).send('Erro do servidor');
    }
})

server.listen(5000, () => {console.log('Server on')})