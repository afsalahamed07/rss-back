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
    const data = await Promise.all(
      rssList.map(async (rssItem) => {
        try {
          const response = await fetch(rssItem.link); // Assuming `rssItem` contains a `url` field
          const text = await response.text();
          return { link: rssItem.link, data: text };
        } catch (fetchError: any) {
          // NOTE: here we should try to cach specific errors rather than
          // generics
          return { link: rssItem.link, error: fetchError.message };
        }
      }),
    );

    return c.json({ data: data }, 200, {
      "Content-Type": "application/json",
    });
  } catch (error) {
    return c.json({ msg: "Error occured fetchgin saveed feeds list" }, 500);
  }
});

export default feedRoute;
