import {WebSocket, WebSocketServer} from 'ws'

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
    
    wss.on('connection',(socket)=>{
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
        },3000)

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