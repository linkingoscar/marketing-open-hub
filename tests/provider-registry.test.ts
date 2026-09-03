import { describe, it, expect } from "vitest";
import { API_PROVIDERS } from "@/lib/api/config";
import { TRUSTED_PROVIDER_BASE_URLS } from "@/app/api/chat/route";

describe("Provider Registry Consistency (FINAL-005)", () => {
  it("ensures every built-in provider in API_PROVIDERS has a trusted server base URL", () => {
    const builtInProviders = API_PROVIDERS.filter((p) => p.id !== "custom");

    expect(builtInProviders.length).toBeGreaterThan(0);

    for (const p of builtInProviders) {
      expect(
        TRUSTED_PROVIDER_BASE_URLS[p.id],
        `Provider "${p.id}" (${p.name}) must exist in TRUSTED_PROVIDER_BASE_URLS`
      ).toBeDefined();

      expect(p.models.length).toBeGreaterThan(0);
      expect(p.baseUrl).toBeTruthy();
    }
  });

  it("ensures no stale or unsupported providers exist in TRUSTED_PROVIDER_BASE_URLS", () => {
    const providerIds = new Set(API_PROVIDERS.map((p) => p.id));

    for (const id of Object.keys(TRUSTED_PROVIDER_BASE_URLS)) {
      expect(
        providerIds.has(id),
        `Trusted URL contains "${id}" which is not in API_PROVIDERS`
      ).toBe(true);
    }
  });

  it("ensures wenxin is completely removed from active providers", () => {
    const ids = API_PROVIDERS.map((p) => p.id);
    expect(ids).not.toContain("wenxin");
    expect(TRUSTED_PROVIDER_BASE_URLS["wenxin"]).toBeUndefined();
  });
});
