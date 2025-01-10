import { Hono } from "hono";
import { cors } from "hono/cors";
import rssRouter from "./src/routes/rssRoute";
import feedRoute from "./src/routes/feedRoute";

const app = new Hono();

app.use(cors());

app.route("/rss-feed", feedRoute);
app.route("/rss", rssRouter);

const server = Bun.serve({
  fetch: app.fetch,
  // Optional port number - the default value is 3000
  port: process.env.PORT || 3000,
});

console.log(`Server listening on port ${server.port}`);
