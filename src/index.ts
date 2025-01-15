import express from "express";
import { Server as WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import path from "path";
import notificationsRouter from "./routes/notifications/index";

const PORT = 8000;
const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

const server = createServer(app);
const wss = new WebSocketServer({ server });
const clients = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'identify') {
        clients.set(data.userId, ws);
        console.log(`Client identified: ${data.userId}`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    for (const [userId, client] of clients.entries()) {
      if (client === ws) {
        clients.delete(userId);
        console.log(`Client disconnected: ${userId}`);
        break;
      }
    }
  });
});

export const broadcastNotification = (receiverId: string, notification: any) => {
  const client = clients.get(receiverId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({
      type: 'notification',
      data: notification
    }));
  }
};

app.get("/", (req: express.Request, res: express.Response) => {
  res.render("home", { title: "Notification Framework In Memory Implementation" });
});

app.use("/notifications", notificationsRouter);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
});

export { app, server };