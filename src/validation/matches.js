import { z } from "zod";

/**
 * MATCH_STATUS constant
 * Key-value pairs in lowercase as required
 */
export const MATCH_STATUS = {
  scheduled: "scheduled",
  live: "live",
  finished: "finished",
};

/**
 * Helper: ISO Date String Validation
 */
const isValidIsoDate = (value) => {
  const date = new Date(value);
  return !isNaN(date.getTime()) && value === date.toISOString();
};

/**
 * listMatchesQuerySchema
 * Optional limit
 * Coerced positive integer
 * Max 100
 */
export const listMatchesQuerySchema = z.object({
  limit: z
    .coerce
    .number()
    .int()
    .positive()
    .max(100)
    .optional(),
});

/**
 * matchIdParamSchema
 * Required id
 * Coerced positive integer
 */
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * createMatchSchema
 */
export const createMatchSchema = z
  .object({
    sport: z.string().min(1),
    homeTeam: z.string().min(1),
    awayTeam: z.string().min(1),

    startTime: z
      .string()
      .refine(isValidIsoDate, {
        message: "startTime must be a valid ISO date string",
      }),

    endTime: z
      .string()
      .refine(isValidIsoDate, {
        message: "endTime must be a valid ISO date string",
      }),
      
   

    homeScore: z.coerce.number().int().min(0).optional(),
    awayScore: z.coerce.number().int().min(0).optional(),
  }).superRefine((data, ctx) => {
    // Only validate chronological order if endTime exists
    
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);

      if (end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "endTime must be after startTime",
          path: ["endTime"],
        });
      }
    
  });
  

/**
 * updateScoreSchema
 * Requires both scores
 */
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().min(0),
  awayScore: z.coerce.number().int().min(0),
});

