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
  const link = body?.link.trim();

  console.log(link);
  try {
    // this might thrwo a "invalid url error"
    // thus validating the url string
    const title = new URL(link).hostname;

    // this is a parital testigng and on matter this
    // validate the actualw content of the passed in link
    // proper erro handling is required when serving the
    // rss content
    const response = await fetch(link, { method: "HEAD" });
    if (!response.ok) {
      return c.json(
        { msg: "Invalid RSS feed URL, request returned an error" },
        400,
        {
          "Content-Type": "application/json",
        },
      );
    }

    await db.insert(rss).values({
      link: link,
      title: title,
    });
  } catch (error: any) {
    if (error.code == "ERR_INVALID_URL") {
      return c.json({ msg: "invlaid url, check your url sturcture" }, 400, {
        "Content-Type": "application/json",
      });
    }
    // errno 2067 : "SQLITE_CONSTRAINT_UNIQUE"
    else if (error.errno == 2067) {
      return c.json({ msg: "Unique contraint violation" }, 409, {
        "Content-Type": "application/json",
      });
    } else {
      // the console log added here to check weather the error
      // can be managed properly or even sedning a better error response
      console.log(error);
      return c.json({ msg: "Error fetching the provided url" }, 500, {
        "Content-Type": "application/json",
      });
    }
  }

  return c.json({ msg: `Inserted ${link} to rss` }, 201, {
    "Content-Type": "application/json",
  });
});

rssRouter.delete("/:id", async (c) => {
  console.log("gettin a request");
  const id = c.req.param("id");

  try {
    await db.delete(rss).where(eq(rss.id, Number(id)));
  } catch (error) {
    console.log(error);
    // WARN: possbily the worst thin i can do sending out error
    return c.json({ msg: `Error occured while deleting` }, 500);
  }
  return c.json({ msg: `id : ${id} deleted from rss` }, 204);
});
export default rssRouter;
