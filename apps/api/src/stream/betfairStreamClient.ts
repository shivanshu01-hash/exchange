import tls from "node:tls";
import { env } from "../config/env.js";
import { setMarketSnapshot } from "../services/marketCache.js";

type StreamOptions = { host?: string; port?: number; marketIds: string[] };

export class BetfairStreamClient {
  private socket?: tls.TLSSocket;
  private buffer = "";
  private reconnectTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private lastMessageAt = 0;

  constructor(private options: StreamOptions) {}

  connect() {
    if (!env.BETFAIR_APP_KEY || !env.BETFAIR_SESSION_TOKEN) return;
    this.socket = tls.connect({ host: this.options.host || "stream-api.betfair.com", port: this.options.port || 443 }, () => {
      this.lastMessageAt = Date.now();
      this.send({ op: "authentication", appKey: env.BETFAIR_APP_KEY, session: env.BETFAIR_SESSION_TOKEN });
      this.send({ op: "marketSubscription", id: 1, marketFilter: { marketIds: this.options.marketIds }, marketDataFilter: { fields: ["EX_BEST_OFFERS", "EX_TRADED", "EX_LTP", "EX_MARKET_DEF"] } });
      this.startHeartbeatWatch();
    });
    this.socket.on("data", (chunk) => this.onData(chunk.toString("utf8")));
    this.socket.on("error", () => this.scheduleReconnect());
    this.socket.on("close", () => this.scheduleReconnect());
  }

  close() {
    clearTimeout(this.reconnectTimer);
    clearInterval(this.heartbeatTimer);
    this.socket?.destroy();
  }

  private send(payload: unknown) {
    this.socket?.write(`${JSON.stringify(payload)}\r\n`);
  }

  private onData(data: string) {
    this.buffer += data;
    let index = this.buffer.indexOf("\r\n");
    while (index >= 0) {
      const line = this.buffer.slice(0, index);
      this.buffer = this.buffer.slice(index + 2);
      if (line) this.onMessage(JSON.parse(line));
      index = this.buffer.indexOf("\r\n");
    }
  }

  private async onMessage(message: any) {
    this.lastMessageAt = Date.now();
    if (message.op !== "mcm") return;
    for (const market of message.mc || []) {
      const definition = market.marketDefinition || {};
      await setMarketSnapshot({
        marketId: market.id,
        eventId: definition.eventId || `event_${market.id}`,
        eventName: definition.eventName || "Live Event",
        marketName: definition.name || "Match Odds",
        marketType: definition.marketType || "MATCH_ODDS",
        status: definition.status === "OPEN" ? "OPEN" : "SUSPENDED",
        startTime: definition.marketTime || new Date().toISOString(),
        version: market.img ? 1 : Date.now(),
        updatedAt: new Date().toISOString(),
        totalMatched: market.tv || 0,
        inPlay: definition.inPlay || false,
        runners: (market.rc || []).map((runner: any) => ({
          selectionId: String(runner.id),
          selectionName: runner.name || `Runner ${runner.id}`,
          back: (runner.batb || []).slice(0, 3).map(([price, size]: [number, number]) => ({ price, size })),
          lay: (runner.batl || []).slice(0, 3).map(([price, size]: [number, number]) => ({ price, size })),
          lastTradedPrice: runner.ltp,
          matchedVolume: runner.tv || 0,
          status: "ACTIVE"
        }))
      });
    }
  }

  private startHeartbeatWatch() {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (Date.now() - this.lastMessageAt > 15_000) this.scheduleReconnect();
    }, 5000);
  }

  private scheduleReconnect() {
    this.close();
    this.reconnectTimer = setTimeout(() => this.connect(), 2000 + Math.floor(Math.random() * 3000));
  }
}
