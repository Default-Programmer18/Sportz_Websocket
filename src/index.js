import express from 'express';
import {matchRouter} from './routes/matches.js'
import http from 'http'
import { attachWebsocketConnection } from './ws/server.js';


const PORT=Number(process.env.PORT || 8000);
const HOST=process.env.HOST || '0.0.0.0'

const app=express();
const server= http.createServer(app)

app.use(express.json())

app.get('/',(req,res)=>{
    res.send('Hello from Express Server')
})

app.use('/matches',matchRouter)

const broadcastMatchCreated= attachWebsocketConnection(server)
app.locals.broadcastMatchCreated=broadcastMatchCreated;


server.listen(PORT,()=>{
    const baseUrl= HOST==='0.0.0.0'? `http://localhost:${PORT}`: `http://${HOST}:${PORT}`;
    console.log(`server listens at ${baseUrl}`)
    console.log(`ws running on ${baseUrl.replace('http','ws')}/ws`)
})