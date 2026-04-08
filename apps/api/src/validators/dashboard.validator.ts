import { z } from "zod";

export const createAnalysisSchema = z.object({
  inputUrl: z.string().url(),
});
