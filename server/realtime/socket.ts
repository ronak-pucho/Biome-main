import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type { Socket } from "socket.io";
import { priceService } from "../services/priceService";

export function createSocketServer(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    socket.on("watch-price", async () => {
      socket.emit("watch-ack", { ok: true });
    });

    socket.on("search-update", async () => {
      socket.emit("results-ready", { ok: true });
    });
  });

  setInterval(async () => {
    try {
      const triggered = await priceService.checkPriceAlerts();
      for (const alert of triggered) {
        io.emit("price-alert", {
          alertId: alert.id,
          itemId: alert.itemId,
          newPrice: alert.currentPrice,
          platform: alert.platform,
        });
      }
    } catch {
      return;
    }
  }, 60_000);

  return io;
}
