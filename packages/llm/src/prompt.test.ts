import { describe, expect, it } from "vitest";

import { exampleItems } from "./__fixtures__/example-items";
import { buildMessages } from "./prompt";

describe("buildMessages", () => {
  it("marks data as untrusted and defaults to zh-CN", () => {
    const [system, user] = buildMessages({ query: "AI 编程工具", items: exampleItems });
    expect(system.role).toBe("system");
    expect(system.content).toMatch(/untrusted DATA/);
    expect(system.content).toMatch(/Never invent/);
    expect(system.content).toMatch(/isSubjective/);
    expect(system.content).toContain("zh-CN");
    expect(user.content).toContain(exampleItems[0].itemId);
    expect(user.content).toContain("AI 编程工具");
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
});
