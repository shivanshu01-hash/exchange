import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listCachedMarkets } from "../services/marketCache.js";
import { cricketProvider } from "../services/cricketProvider.js";

export const cricketRouter = Router();
cricketRouter.use(requireAuth);

cricketRouter.get("/live", async (_req, res, next) => {
  try { res.json(await cricketProvider.liveMatches()); } catch (err) { next(err); }
});

cricketRouter.get("/recent", async (_req, res, next) => {
  try { res.json(await cricketProvider.recentMatches()); } catch (err) { next(err); }
});

cricketRouter.get("/upcoming", async (_req, res, next) => {
  try { res.json(await cricketProvider.upcomingMatches()); } catch (err) { next(err); }
});

cricketRouter.get("/matches/:matchId", async (req, res, next) => {
  try { res.json(await cricketProvider.matchInfo(req.params.matchId)); } catch (err) { next(err); }
});

cricketRouter.get("/matches/:matchId/scorecard", async (req, res, next) => {
  try { res.json(await cricketProvider.scorecard(req.params.matchId)); } catch (err) { next(err); }
});

cricketRouter.get("/matches/:matchId/commentary", async (req, res, next) => {
  try { res.json(await cricketProvider.commentary(req.params.matchId)); } catch (err) { next(err); }
});

cricketRouter.get("/matches/:matchId/ball-by-ball", async (req, res, next) => {
  try { res.json(await cricketProvider.overs(req.params.matchId)); } catch (err) { next(err); }
});

cricketRouter.get("/players/:playerId", async (req, res, next) => {
  try { res.json(await cricketProvider.player(req.params.playerId)); } catch (err) { next(err); }
});

cricketRouter.get("/players/:playerId/batting", async (req, res, next) => {
  try { res.json(await cricketProvider.playerBatting(req.params.playerId)); } catch (err) { next(err); }
});

cricketRouter.get("/players/:playerId/bowling", async (req, res, next) => {
  try { res.json(await cricketProvider.playerBowling(req.params.playerId)); } catch (err) { next(err); }
});

cricketRouter.get("/series/:seriesId", async (req, res, next) => {
  try { res.json(await cricketProvider.series(req.params.seriesId)); } catch (err) { next(err); }
});

cricketRouter.get("/series/:seriesId/squads", async (req, res, next) => {
  try { res.json(await cricketProvider.seriesSquads(req.params.seriesId)); } catch (err) { next(err); }
});

cricketRouter.get("/series/:seriesId/points-table", async (req, res, next) => {
  try { res.json(await cricketProvider.seriesPointsTable(req.params.seriesId)); } catch (err) { next(err); }
});

cricketRouter.get("/odds", async (_req, res, next) => {
  try {
    const markets = await listCachedMarkets();
    res.json({ source: "exchange-market-cache", markets: markets.filter((market) => /cricket|ipl|match odds/i.test(`${market.eventName} ${market.marketName}`)) });
  } catch (err) { next(err); }
});
