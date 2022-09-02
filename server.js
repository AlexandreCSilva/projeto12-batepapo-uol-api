import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import joi from 'joi';
import { MongoClient } from "mongodb";
dotenv.config();

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

        console.log(validUser)
       
        if (validUser.length !== 0){
            res.status(409).send('O nome já está sendo usado');
        } else {
            const validation = userSchema.validate(user, { abortEarly: true });
            console.log(validation)

            if (validation.error) {
                res.status(422).send('Nome inválido');
            } else {
                const dbuser = await db.collection('users').insertOne({name: user.name, lastStatus: Date.now()});
                res.status(201);
            }
        }
    } catch (error) {
        res.status(500).send('Erro do servidor');
    }
})

server.listen(5000, () => {console.log('Server on')})