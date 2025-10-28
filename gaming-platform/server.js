const { Server } = require("socket.io");
const http = require("http");
const { PrismaClient } = require("@prisma/client");

const PORT = process.env.SOCKET_PORT || 4000;
const prisma = new PrismaClient();

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.type === 'emit' && data.event && data.data) {
          io.emit(data.event, data.data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request' }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(200);
    res.end("Socket.IO server running");
  }
});

const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for now
    methods: ["GET", "POST"],
    credentials: true
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

  // Global chat message handling
  socket.on("global chat message", async (msg) => {
    console.log("[Socket] Received global chat message:", msg);
    try {
      // Save message to database
      const savedMessage = await prisma.globalMessage.create({
        data: {
          content: msg.content,
          senderId: msg.senderId,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              image: true,
            },
          },
        },
      });
      // Broadcast to all connected clients
      io.emit("global chat message", savedMessage);
    } catch (error) {
      console.error("Error saving global message:", error);
    }
  });

  // Match room handling
  socket.on("join match room", (matchId) => {
    socket.join(matchId);
    console.log(`User ${socket.id} joined match room ${matchId}`);
  });

  socket.on("leave match room", (matchId) => {
    socket.leave(matchId);
    console.log(`User ${socket.id} left match room ${matchId}`);
  });

  // Match chat message handling
  socket.on("match chat message", async (msg) => {
    console.log("[Socket] Received match chat message:", msg);
    try {
      // Save message to database
      console.log("[Socket] Attempting to save match message to database...");
      const savedMessage = await prisma.matchMessage.create({
        data: {
          content: msg.content,
          senderId: msg.senderId,
          matchId: msg.matchId,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              image: true,
            },
          },
        },
      });
      console.log("[Socket] Message saved successfully:", savedMessage);
      // Broadcast to all clients in this match room
      console.log("[Socket] Broadcasting to match room:", msg.matchId);
      io.to(msg.matchId).emit("match chat message", savedMessage);
      console.log("[Socket] Message broadcast complete");
    } catch (error) {
      console.error("[Socket] Error saving match message:", error);
      console.error("[Socket] Error details:", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
}); 