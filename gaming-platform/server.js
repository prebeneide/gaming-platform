const { Server } = require("socket.io");
const http = require("http");

const PORT = process.env.SOCKET_PORT || 4000;

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Socket.IO server running");
});

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"], // Allowing both dev ports
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("chat message", (msg) => {
    console.log("Received chat message on server:", msg);
    io.emit("chat message", msg);
  });

  socket.on("typing", (data) => {
    console.log("Received typing event on server:", data);
    io.emit("typing", data);
  });

  socket.on("stop typing", (data) => {
    console.log("Received stop typing event on server:", data);
    io.emit("stop typing", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
}); 