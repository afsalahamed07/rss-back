import { Hono } from "hono";
import { db } from "../db/db";
import { rss } from "../db/schema.ts";

const feedRoute = new Hono();

feedRoute.get("/", async (c) => {
  // NOTE: Fetch data for each RSS feed concurrently
  // this required some sort of caching and queing
  // and well inthe front end
  try {
    const rssList: (typeof rss.$inferSelect)[] = await db.select().from(rss);

    const encoder = new TextEncoder();
    c.header("Content-Type", "application/json");
    c.header("Transfer-Encoding", "chunked");

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode("["));

        for (let i = 0; i < rssList.length; i++) {
          const rssItem = rssList[i];
          try {
            const response = await fetch(rssItem.link); // Assuming `rssItem` contains a `url` field
            const text = await response.text();
            const chunk = JSON.stringify({ link: rssItem.link, data: text });

            controller.enqueue(encoder.encode(chunk));
            if (i < rssList.length - i) {
              controller.enqueue(encoder.encode(","));
            }
          } catch (fetchError: any) {
            const errorChunk = JSON.stringify({
              link: rssItem.link,
              error: fetchError.message,
            });
            controller.enqueue(encoder.encode(errorChunk));
          }
        }

        controller.enqueue(encoder.encode("]"));
        controller.close();
      },
    });

    return c.body(stream, 200);
  } catch (error) {
    return c.json({ msg: "Error occured fetchgin saveed feeds list" }, 500);
  }
});

export default feedRoute;
