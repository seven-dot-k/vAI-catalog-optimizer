import type { BrandVoice } from "@/lib/schemas/brand-voice";

const brandVoices: BrandVoice[] = [
  {
    catalog: "Main Store",
    voice:
      "Friendly, enthusiastic, and conversational. Use active voice and short sentences. Highlight benefits over features. Speak directly to the customer using 'you' and 'your'. Avoid jargon and overly technical language. Be genuine — never pushy or salesy. Convey confidence and expertise while remaining approachable.",
  },
];

export function getBrandVoice(catalog?: string): string {
  const match = brandVoices.find(
    (bv) => bv.catalog.toLowerCase() === (catalog ?? "main store").toLowerCase()
  );
  return match?.voice ?? brandVoices[0].voice;
}
