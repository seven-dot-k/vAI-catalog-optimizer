import { describe, it, expect } from "vitest";
import { getBrandVoice } from "@/lib/data/brand-voices";

describe("getBrandVoice", () => {
  it("returns brand voice for Main Store", () => {
    const voice = getBrandVoice("Main Store");
    expect(voice).toBeTruthy();
    expect(typeof voice).toBe("string");
    expect(voice.length).toBeGreaterThan(20);
  });

  it("returns default voice when no catalog specified", () => {
    const voice = getBrandVoice();
    expect(voice).toBeTruthy();
    expect(voice).toContain("Friendly");
  });

  it("returns default voice for unknown catalog", () => {
    const voice = getBrandVoice("Unknown Catalog");
    expect(voice).toBeTruthy();
  });

  it("is case-insensitive", () => {
    const voice1 = getBrandVoice("main store");
    const voice2 = getBrandVoice("MAIN STORE");
    expect(voice1).toBe(voice2);
  });
});
