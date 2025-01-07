import { Hono } from "hono";
import { cors } from "hono/cors";
import rssRouter from "./src/routes/rssRoute";

const app = new Hono();

app.use(cors());

app.get("/rss-feed", async (c) => {
  try {
    const response = await fetch("https://alistapart.com/main/feed/");
    const data = await response.text();
    return c.body(data, 200, { "Content-Type": "application/xml" });
  } catch (error) {
    c.text("Error fetching RSS feed", 500);
  }
});

app.route("/rss", rssRouter);

const server = Bun.serve({
  fetch: app.fetch,
  // Optional port number - the default value is 3000
  port: process.env.PORT || 3000,
});

console.log(`Server listening on port ${server.port}`);
