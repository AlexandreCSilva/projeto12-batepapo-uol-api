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
    name: joi.string().required(),
});

server.use(cors());
server.use(express.json());

let db;

mongoClient.connect().then(() => {
    db = mongoClient.db('batePapoUol');
});

server.post('/participants', async (req, res) => {
    /* const user = req.body;
    const validUser = await db.collection('users').find().toArray();

    console.log(validUser) */
    try {
        const user = req.body;
        const validUser = await db.collection('users').find(user).toArray();

        if (validUser.length !== 0){
            res.status(409).send('O nome já está sendo usado');
        } else {
            const validation = userSchema.validate(user, { abortEarly: true });

            if (validation.error) {
                res.status(422).send('Nome inválido');
            } else {
                await db.collection('users').insertOne({name: user.name, lastStatus: Date.now()});
                await db.collection('messages').insertOne({from: 'xxx', to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs(Date.now()).format("HH:MM:ss")});
                res.status(201);
            }
        }
    } catch (error) {
        res.status(500).send('Erro do servidor');
    }
})

server.get('/participants', async (req, res) => {
    try {
        const users = await db.collection('users').find().toArray();
        const usersSent = [];
        users.forEach((user) => {
            usersSent.push({ name: user.name, lastStatus: user.lastStatus});
        })
        res.status(201).send(usersSent);
    } catch (error) {
        res.status(500).send('Erro do servidor');
    }
})

server.listen(5000, () => {console.log('Server on')})