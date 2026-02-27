import {WebSocket, WebSocketServer} from 'ws'

const sendJson=(socket,payload)=>{
    if(socket.readyState !=WebSocket.OPEN)
        return;
     socket.send(JSON.stringify(payload))

}
const broadcast=(wss,payload)=>{
    wss.clients.forEach((client) => {
        if(client.readyState !=WebSocket.OPEN)
            return;
        client.send(JSON.stringify(payload));

    });
}

export function attachWebsocketConnection(server){
    const wss =new WebSocketServer({
        server,
        path:'/ws',
        maxPayload:1024*1204,
    });
    
    wss.on('connection',(socket)=>{
console.log('socket connected')
        sendJson(socket,{type:"welcome"})
        socket.on('error',console.error)
    })

    function broadcastMatchCreated(match){
        broadcast(wss,{type:'match created', data: match})
    }
    return broadcastMatchCreated;
}