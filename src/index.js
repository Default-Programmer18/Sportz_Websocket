import express from 'express';
import {matchRouter} from './routes/matches.js'

const app=express();
const port=8080;
app.use(express.json())

app.get('/',(req,res)=>{
    res.send('Hello from Express Server')
})

app.use('/matches',matchRouter)

app.listen(port,()=>{
    console.log('server listens at port 8080')
})