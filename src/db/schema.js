import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";

//
// ENUM: match_status
//
export const matchStatusEnum = pgEnum("match_status", [
  "scheduled",
  "live",
  "finished",
]);

//
// TABLE: matches
//
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),

  sport: text("sport").notNull(),

  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),

  status: matchStatusEnum("status")
    .default("scheduled")
    .notNull(),

  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),

  homeScore: integer("home_score").default(0).notNull(),
  awayScore: integer("away_score").default(0).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

//
// TABLE: commentary
//
export const commentary = pgTable("commentary", {
  id: serial("id").primaryKey(),

  matchId: integer("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),

  minute: integer("minute").notNull(),
  sequence: integer("sequence").notNull(),
  period: text("period"), // e.g. "1st Half", "2nd Quarter"
  eventType: text("event_type"), // e.g. "goal", "foul", "timeout"

  actor: text("actor"), // player involved
  team: text("team"),   // which team

  message: text("message").notNull(),

  metadata: jsonb("metadata").default({}), // extra event data

  tags: text("tags").array(), // array of tags

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});