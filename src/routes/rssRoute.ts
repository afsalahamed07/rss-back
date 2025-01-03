import { Hono } from "hono";
import { rss } from "../db/schema";
import { db } from "../db/db";
import { eq } from "drizzle-orm";

const rssRouter = new Hono();

rssRouter.get("/", async (c) => {
  const result = await db.select().from(rss);

  console.log("result", result);

  return c.body(JSON.stringify(result), 200, {
    "Content-Type": "application/json",
  });
});

rssRouter.post("/", async (c) => {
  const body = await c.req.json();
  const link = body["link"];

  const tiltle = new URL(link).hostname;

  try {
    await db.insert(rss).values({
      link: link,
      title: tiltle,
    });
  } catch (error) {
    console.log(error);
    // WARN: possbily the worst thin i can do sending out error
    return c.text(`Error occured while inserting: ${error}`);
  }

  return c.text(`Inserted ${link} to rss`);
});

rssRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    await db.delete(rss).where(eq(rss.id, id));
  } catch (error) {
    console.log(error);
    // WARN: possbily the worst thin i can do sending out error
    return c.text(`Error occured while deleting: ${error}`);
  }
  return c.text(`id : ${id} deleted from rss`);
});
export default rssRouter;
