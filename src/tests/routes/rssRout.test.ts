import { describe, it, expect, mock } from "bun:test";
import rssRouter from "../../routes/rssRoute";
import { db } from "../../db/db";
import { Hono } from "hono";

const mockInsert = mock(() => ({
  values: mock().mockResolvedValueOnce({}),
}));

// type errors are ignored here
// this not to test the fucniton of the orm
// but to test the validation of the prvoided feed links
db.insert = mockInsert;

describe("RSS route POST /", () => {
  const app = new Hono();
  app.route("/rss", rssRouter);

  it("should return 201 when a valid RSS link is provided", async () => {
    const validRSSLink = "https://alistapart.com/main/feed/";

    const response = await app.request("/rss", {
      body: JSON.stringify({ link: validRSSLink }),
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(201);
  });

  it("should return 400 when an invalid RSS link is provide: that dosn't \
    have a propeer url structure", async () => {
    const invalidRSSLink = "invalid-url";

    const response = await app.request("/rss", {
      body: JSON.stringify({ link: invalidRSSLink }),
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(400);
  });

  it("should return 400 when an invalid RSS link is provide: \
    with the a proper url structer but not eh working link", async () => {
    const invalidRSSLink = "https://example.com/feed";

    const response = await app.request("/rss", {
      body: JSON.stringify({ link: invalidRSSLink }),
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(400);
  });
});
