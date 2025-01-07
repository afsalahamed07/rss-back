import { Hono } from "hono";
import { cors } from "hono/cors";
import rssRouter from "./src/routes/rssRoute";
import { rss } from "./src/db/schema";
import { db } from "./src/db/db";

const app = new Hono();

app.use(cors());

app.get("/rss-feed", async (c) => {
  try {
    const rssList = await db.select().from(rss);
    // Fetch data for each RSS feed concurrently
    const data = await Promise.all(
      rssList.map(async (rssItem) => {
        try {
          const response = await fetch(rssItem.link); // Assuming `rssItem` contains a `url` field
          const text = await response.text();
          return { link: rssItem.link, data: text };
        } catch (fetchError) {
          return { link: rssItem.link, error: fetchError.message };
        }
      }),
    );

    return c.json({ data: data }, 200, {
      "Content-Type": "application/json",
    });
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
