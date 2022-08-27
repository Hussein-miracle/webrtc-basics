import express from "express";
import http from "http";
import {Server} from "socket.io"; 
const PORT = process.env.PORT || 3000;
let connected = false;

const app = express();    
const server = http.Server(app);
let io = new Server(server);

app.use(express.static("public"));


server.listen(PORT, () => {
  console.log(`Connected on port:${PORT}`);
  console.log(`The link is:: http://localhost:${PORT}`);
});

  
io.on("connection",(socket)=>{

  if(connected){
      console.log("A user connected");



  //LISTEN  create-or-join  EVENT
  socket.on("create-or-join",(roomId) =>{
    console.log("create or join event  to roomid:",roomId);
    
    console.log(io.sockets.adapter.rooms ,"adapter rooms");

    const myRoom = io.sockets.adapter.rooms[roomId] || {size:0};
    
    const numClients = myRoom.size;
    
    console.log(roomId,"has",numClients,"clients");

    if(numClients === 0){
      socket.join(roomId);

      socket.emit("created", roomId);
    }else if(numClients === 1){
      socket.join(roomId);
      socket.emit("joined",roomId);
      
    }else{
      socket.emit("full",roomId);

    }
    
  });


  //LISTEN  ready  EVENT
  socket.on("ready",(room)=>{
    socket.broadcast.to(room).emit("ready");
  })
  //LISTEN  candidate  EVENT
  socket.on("candidate",(event)=>{
    socket.broadcast.to(event.room).emit("candidate",event);
  })
  //LISTEN  offer  EVENT
  socket.on("offer",(event) => {
    
    socket.broadcast.to(event.room).emit("offer",event.sdp);
    
    
  })
  
  
  //LISTEN  answer  EVENT
  socket.on("answer", event => {
    socket.broadcast.to(event.room).emit("answer",event.sdp);
  })
  }




  connected = true;
})


