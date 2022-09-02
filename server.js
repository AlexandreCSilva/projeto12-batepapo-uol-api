import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import joi from 'joi';
import { MongoClient } from "mongodb";
dotenv.config();

const server = express();
const mongoClient = new MongoClient(process.env.MONGO_URI);
const Joi = joi;

server.use(cors());
server.use(express.json());

let db;

mongoClient.connect().then(() => {
    db = mongoClient.db('batePapoUol');
});

server.post('/participants', async (req, res) => {
    const user = req.body;
    const users = await db.collection('users').find().toArray();

    if (user){
        console.log(user)
    }
    
})

server.listen(5000, () => {console.log('Server on')})