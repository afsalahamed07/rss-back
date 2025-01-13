import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const rss = sqliteTable("rss", {
  id: integer("id").primaryKey(),
  title: text("title"),
  link: text("link").unique().notNull(),
});

export const entry = sqliteTable("entry", {
  id: integer("id").primaryKey(),
  title: text("title"),
  link: text("link"),
  pubDate: text("pubDate"),
  creator: text("creator"),
  content: text("content"),
  contentSnippet: text("contentSnippet"),
  guid: text("guid"),
  categories: text("categories"),
  isoDate: text("isoDate"),
  subject: text("subject"),
  author: text("author"),
  feedUrl: text("feedUrl"),
  domain: text("domain"),
});
