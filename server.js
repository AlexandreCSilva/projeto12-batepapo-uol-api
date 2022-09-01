import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import joi from 'joi';
import { MongoClient } from "mongodb";
dotenv.config();

const server = express();
const mongoClient = new MongoClient('mongodb://localhost:27017');
const joi = joi();

server.use(cors());
server.use(express.json());

let db;

mongoClient.connect().then(() => {
    db = mongoClient.db('batePapoUol');
})

server.post('/participants', (req, res) => {
    let user = req.body;
    
    if (!user.name || user.name === ''){
        console.log('erro')
    }
    console.log(req.body)
})

server.listen(5000, () => {console.log('Server on')})