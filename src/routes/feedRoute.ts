import { Hono } from "hono";
import { db } from "../db/db";
import { rss } from "../db/schema.ts";
import Parser from "rss-parser";
import { redis } from "../db/redisClient.ts";

const feedRoute = new Hono();

const parser = new Parser({
  customFields: {
    item: [
      ["dc:subject", "subject"],
      ["author.name", "author"],
    ],
  },
});

export async function feedCacher() {
  console.info(Date(), " : ", "Updating feed cache");
  const rssList: (typeof rss.$inferSelect)[] = await db.select().from(rss);

  for (let i = 0; i < rssList.length; i++) {
    const rssItem = rssList[i];
    try {
      const response = await parser.parseURL(rssItem.link);

      // Use a normal for...of loop for the items
      for (const entry of response.items) {
        try {
          await redis.set(
            entry.link?.trim() as string,
            JSON.stringify({ ...entry, domain: response.title }),
            "EX",
            3600,
          );

          const dateTimestamp =
            entry.pubDate != undefined
              ? Date.parse(entry.pubDate)
              : entry.isoDate != undefined
                ? Date.parse(entry.isoDate)
                : String(Date.now());
          if (Number.isNaN(dateTimestamp)) {
            throw new Error(`Invalid date: ${entry.pubDate}`);
          }

          await redis.zadd(
            "pub:date",
            dateTimestamp,
            entry.link?.trim() as string,
          );
        } catch (err) {
          console.error("Error in item loop:", err);
        }
      }
    } catch (error) {
      console.log("Error while caching:", error);
    }
  }
}

feedRoute.get("/:page", async (c) => {
  try {
    const page = Number(c.req.param("page")) ?? 1;
    const encoder = new TextEncoder();
    c.header("Content-Type", "application/json");
    c.header("Transfer-Encoding", "chunked");

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const entries = await redis.zrevrange(
            "pub:date",
            (page - 1) * 20,
            page * 20,
          );

          for (const entry of entries) {
            const item = await redis.get(entry);

            const chunk = JSON.stringify({
              link: entry,
              item: item,
            });

            // Enqueue data while controller is valid
            controller.enqueue(encoder.encode(chunk + "\n"));
          }
        } catch (error: any) {
          console.log("errro while tretreiveing entries", error);
          const errorChunk = JSON.stringify({
            error: error.message,
          });
          controller.enqueue(encoder.encode(errorChunk + "\n"));
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
