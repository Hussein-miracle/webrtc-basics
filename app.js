
import express from "express";
import http from "http";
import {Server} from "socket.io"; 
const PORT = process.env.PORT || 3000;
// console.log(process.env , "env")
const app = express();    
const server = http.Server(app);
let io = new Server(server);

app.use(express.static("public"));


server.listen(PORT, () => {
  console.log(`Connected on port:${PORT}`);
});

  
io.on("connection",(socket)=>{
  console.log("a user connected");



  //LISTEN  create-or-join  EVENT
  socket.on("create-or-join",(roomId) =>{
    console.log("create or join event  to roomid:",roomId);
    
    console.log(io.sockets.adapter.rooms ,"adapter rooms");

    const myRoom = io.sockets.adapter.rooms[roomId] || {length:0};
    
    const numClients = myRoom.length;
    
    console.log(roomId,"has",numClients,"clients");

    if(numClients === 0){
      socket.join(roomId);

      socket.emit("created", roomId);
    }else{
      socket.join(roomId);
      socket.emit("joined",roomId);

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



})


