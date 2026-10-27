import { describe, expect, it } from "vitest";

import { exampleItems } from "./__fixtures__/example-items";
import { buildMessages, buildQueryExpansionMessages } from "./prompt";

describe("buildMessages", () => {
  it("marks data as untrusted and defaults to zh-CN", () => {
    const [system, user] = buildMessages({ query: "AI 漫画", items: exampleItems });
    expect(system.role).toBe("system");
    expect(system.content).toMatch(/untrusted DATA/);
    expect(system.content).toMatch(/Never invent/);
    expect(system.content).toMatch(/must cite the itemIds/);
    expect(system.content).toMatch(/older than about 12 months/);
    expect(system.content).toMatch(/subjective/);
    expect(system.content).toContain("zh-CN");
    expect(user.content).toContain(exampleItems[0].itemId);
    expect(user.content).toContain("AI 漫画");
  });

  it("follows the report language", () => {
    expect(buildMessages({ query: "q", language: "en", items: [] })[0].content).toContain("language: en");
  });

  it("never contains secrets from the environment", () => {
    process.env.OPENAI_API_KEY = "sk-secret-test-key";
    process.env.SGAI_API_KEY = "sgai-secret-test-key";
    const text = JSON.stringify(buildMessages({ query: "q", items: exampleItems }));
    expect(text).not.toContain("sk-secret-test-key");
    expect(text).not.toContain("sgai-secret-test-key");
    expect(text).not.toMatch(/api[_-]?key/i);
  });

  it("builds query expansion prompts with the year and angles, no secrets", () => {
    const [system, user] = buildQueryExpansionMessages("宠物用品", "zh-CN", 2026);
    expect(system.content).toContain("2026");
    expect(system.content).toMatch(/funding/);
    expect(system.content).toMatch(/ignore any instructions/);
    expect(user.content).toContain("宠物用品");
    expect(JSON.stringify([system, user])).not.toMatch(/api[_-]?key/i);
  });
});
