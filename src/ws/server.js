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
///////////////////////////////////////////////////////////////////////////////////////
    //working
    //the arcjet security was added before at the time of handshake
    server.on('upgrade',async(req,socket,head)=>{
        if(wsArcjet){
            try{
                const decision = await wsArcjet.protect(req);
                if(decision.isDenied()){
                    if(decision.reason.isRateLimit())
                        socket.write('WS->STATUS-429 -TOO MANY REQUEST')   ; 
                    else
                        socket.write('WS->STATUS-403 -Forbidden')   ; 
                                                  
                    socket.destroy();
                    return;
                }
            }
            catch(e){
                console.log("Security error at ws arcjet connection",e)
                socket.write('WS->STATUS-500 -Internal Server Error')   ; 
                socket.destroy();
                return;
            }
        }
    })
///////////////////////////////////////////////////////
    const wss =new WebSocketServer({
        server,
        path:'/ws',
        maxPayload:1024*1024,
    });

    // Single shared heartbeat interval for all clients
    const pingPongInterval=setInterval(()=>{
        wss.clients.forEach((client)=>{
        if(client.isAlive===false)
            return client.terminate()
        client.isAlive=false
        client.ping()
        })
    },30000); 
    wss.on('close', () => {
       clearInterval(pingPongInterval);
    });  
    
    wss.on('connection',async(socket,req)=>{
        //////////////////////////////////////////////////////////////////////////////////
       // working
        //the arcjet security was added after handshake
        // console.log(wsArcjet)
        // if(wsArcjet){
        //     try{
        //         const decision = await wsArcjet.protect(req);
        //         console.log(decision)
        //         if(decision.isDenied()){

        //             console.log('here')
        //             console.log(decision.reason)
        //             const code= decision.reason.isRateLimit()? 1013:1008;
        //             const reason=decision.reason.isRateLimit()? 'Rate Limit Exceeded':'Access Denied'
                    
        //             socket.close(code,reason);
        //             socket.close()
        //             return;
        //         }
        //     }
        //     catch(e){
        //         console.log("Security error at ws arcjet connection",e)
        //         socket.close(1011,"Internal Server Error")
        //         return;
        //     }
        // }
/////////////////////////////////////////////////////////
        console.log('socket connected')
        socket.isAlive=true
        socket.on('pong',()=>{socket.isAlive=true;})
        sendJson(socket,{type:"welcome"})
        
        socket.on('error',console.error)

        socket.on('close', () => {
            console.log('socket disconnected')
        })
})

    function broadcastMatchCreated(match){
        broadcast(wss,{type:'match created', data: match})
    }
    return broadcastMatchCreated;
}