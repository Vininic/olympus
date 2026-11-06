import { describe, expect, it } from "vitest";
import { speakable } from "./tts";

describe("speakable", () => {
  it("drops emphasis markers instead of reading them out", () => {
    expect(speakable("Isso é **muito** _importante_")).toBe("Isso é muito importante");
  });

  it("replaces fenced code with a spoken placeholder", () => {
    expect(speakable("Veja:\n```js\nconst a = 1;\n```\npronto")).toBe("Veja: (bloco de código) pronto");
  });

  it("keeps link text and drops the URL", () => {
    expect(speakable("Abra o [Chronos](https://chronos.app) agora")).toBe("Abra o Chronos agora");
  });

  it("strips headings and list bullets", () => {
    expect(speakable("## Resumo\n- um\n- dois")).toBe("Resumo um dois");
  });
});
