import {WebSocket, WebSocketServer} from 'ws'
import { wsArcjet } from '../arcjet.js';

const sendJson=(socket,payload)=>{
    if(socket.readyState !=WebSocket.OPEN)
        return;
     socket.send(JSON.stringify(payload))

}
const broadcast=(wss,payload)=>{
    wss.clients.forEach((client) => {
       sendJson(client, payload)

    });
}

export function attachWebsocketConnection(server){
    const wss =new WebSocketServer({
        server,
        path:'/ws',
        maxPayload:1024*1024,
    });
    
    wss.on('connection',async(socket,req)=>{
        if(wsArcjet){
            try{
                const decision = await wsArcjet.protect(req);
                if(decision.isDenied){
                    const code= decision.reason.isRateLimit()? 1013:1008;
                    const reason=decision.reason.isRateLimit()? 'Rate Limit Exceeded':'Access Denied'
                    socket.close(code,reason);
                    return;
                }

            }
            catch(e){
                console.log("Security error at ws arcjet connection",e)
                socket.close()
                return;
            }
        }
        
        console.log('socket connected')
        socket.isAlive=true
        socket.on('pong',()=>{socket.isAlive=true;})
        sendJson(socket,{type:"welcome"})
        
        socket.on('error',console.error)

        const pingPongInterval=setInterval(()=>{
            wss.clients.forEach((client)=>{
                if(client.isAlive===false)
                    return client.terminate()
                client.isAlive=false
                client.ping()
            })
        },1000)

         socket.on('close', () => {
            clearInterval(pingPongInterval)
            console.log('socket disconnected')
        })
    })

    function broadcastMatchCreated(match){
        broadcast(wss,{type:'match created', data: match})
    }
    return broadcastMatchCreated;
}