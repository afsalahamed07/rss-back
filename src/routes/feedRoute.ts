import { Hono } from "hono";
import { db } from "../db/db";
import { rss } from "../db/schema.ts";
import Parser from "rss-parser";

const feedRoute = new Hono();

const parser = new Parser({
  customFields: {
    item: [
      ["dc:subject", "subject"],
      ["author.name", "author"],
    ],
  },
});

feedRoute.get("/", async (c) => {
  try {
    const rssList: (typeof rss.$inferSelect)[] = await db.select().from(rss);

    const encoder = new TextEncoder();
    c.header("Content-Type", "application/json");
    c.header("Transfer-Encoding", "chunked");

    const stream = new ReadableStream({
      async start(controller) {
        for (let i = 0; i < rssList.length; i++) {
          const rssItem = rssList[i];

          try {
            const response = await parser.parseURL(rssItem.link);
            // const text = await response.text();
            const chunk = JSON.stringify({
              link: rssItem.link,
              feed: response,
            });

            controller.enqueue(encoder.encode(chunk + "\n"));
          } catch (error: any) {
            const errorChunk = JSON.stringify({
              link: rssItem.link,
              error: error.message,
            });
            controller.enqueue(encoder.encode(errorChunk + "\n"));
          }
        }
        controller.close();
      },
    });

    return c.body(stream, 200);
  } catch (error) {
    return c.json({ msg: "Error occured fetchgin saveed feeds list" }, 500);
  }
});

export default feedRoute;
