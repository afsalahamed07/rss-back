import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const rss = sqliteTable("rss", {
  id: integer("id").primaryKey(),
  title: text("title"),
  link: text("link").unique().notNull(),
});
