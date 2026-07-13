import { z } from "zod";

import { MAX_NAME_LENGTH } from "./constants";

export const startGameRequestSchema = z.object({
  landingPath: z.string().max(300).default("/"),
  referrer: z.string().max(1_000).nullable().optional(),
});

export const guessRequestSchema = z.object({
  sessionId: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(1)
    .max(MAX_NAME_LENGTH)
    .refine((value) => !containsControlCharacter(value), {
      message: "Control characters are not allowed.",
    }),
});

export const endGameRequestSchema = z.object({
  sessionId: z.string().uuid(),
  reason: z.enum(["gave_up", "abandoned"]).default("gave_up"),
});

export type StartGameRequest = z.infer<typeof startGameRequestSchema>;
export type GuessRequest = z.infer<typeof guessRequestSchema>;
export type EndGameRequest = z.infer<typeof endGameRequestSchema>;

function containsControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127;
  });
}
