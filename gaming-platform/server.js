const { Server } = require("socket.io");
const http = require("http");
const { PrismaClient } = require("@prisma/client");

const PORT = process.env.SOCKET_PORT || 4000;
const prisma = new PrismaClient();

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

  socket.on("chat message", async (msg) => {
    console.log("[Socket] Received chat message:", msg);
    // Lagre meldingen i databasen
    try {
      const savedMessage = await prisma.message.create({
        data: {
          content: msg.content,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
        },
      });
      // Send til mottaker
      io.emit("chat message", savedMessage);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("typing", (data) => {
    console.log("Received typing event on server:", data);
    io.emit("typing", data);
  });

  socket.on("stop typing", (data) => {
    console.log("Received stop typing event on server:", data);
    io.emit("stop typing", data);
  });

  // Legg til ny event for å oppdatere lest-status
  socket.on("mark messages as read", async (data) => {
    console.log("[Socket] Marking messages as read:", data);
    try {
      // Hent alle meldinger som ble markert som lest
      const updatedMessages = await prisma.message.updateMany({
        where: {
          senderId: data.senderId,
          receiverId: data.receiverId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      // Send oppdatering til alle tilkoblede klienter med mer spesifikk informasjon
      io.emit("messages read", {
        senderId: data.senderId,
        receiverId: data.receiverId,
        count: updatedMessages.count,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
}); 