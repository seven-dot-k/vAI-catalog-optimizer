import { z } from "zod";

export const brandVoiceSchema = z.object({
  catalog: z.string(),
  voice: z.string(),
});

export type BrandVoice = z.infer<typeof brandVoiceSchema>;
