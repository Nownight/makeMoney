import { describe, expect, it } from "vitest";

import {
  isRunning,
  opportunityScatter,
  overallScore,
  signalTimeline,
  splitByDate,
  typeDistribution,
} from "@/lib/reports/report-view";

const opp = (timeliness: number, feasibility: number, evidence: number) => ({
  itemIds: ["i1"],
  name: "n",
  whyNow: "",
  whoFits: "",
  howToStart: "",
  risks: [],
  scores: { timeliness, feasibility, evidence },
});

describe("report view helpers", () => {
  it("detects running states", () => {
    expect(isRunning("extracting")).toBe(true);
    expect(isRunning("analyzing")).toBe(true);
    expect(isRunning("completed")).toBe(false);
    expect(isRunning("failed")).toBe(false);
    expect(isRunning("queued")).toBe(false);
  });

  it("counts dated signals per day, ascending", () => {
    expect(
      signalTimeline([{ eventDate: "2026-09-08" }, { eventDate: null }, { eventDate: "2026-07-15" }, { eventDate: "2026-09-08" }]),
    ).toEqual([
      { date: "2026-07-15", count: 1 },
      { date: "2026-09-08", count: 2 },
    ]);
  });

  it("computes type shares largest first", () => {
    const shares = typeDistribution([{ type: "capital" }, { type: "new_tool" }, { type: "capital" }]);
    expect(shares.map((s) => [s.type, s.count])).toEqual([["capital", 2], ["new_tool", 1]]);
    expect(shares[0].share).toBeCloseTo(2 / 3);
    expect(shares[0].label).toBe("资本动向");
  });

  it("maps opportunities to scatter points and separates overlaps", () => {
    const [a, b] = opportunityScatter([opp(4, 3, 5), opp(4, 3, 2)]);
    expect(a).toMatchObject({ index: 1, x: 4, y: 3, size: 5 });
    expect(b.size).toBe(2);
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThan(0.1);
  });

  it("averages scores and splits undated signals", () => {
    expect(overallScore({ timeliness: 5, evidence: 4, feasibility: 4 })).toBe(4.3);
    const { dated, undated } = splitByDate([{ eventDate: "2026-01-01" }, { eventDate: null }, { eventDate: "2026-02-01" }]);
    expect(dated.map((r) => r.eventDate)).toEqual(["2026-02-01", "2026-01-01"]);
    expect(undated).toHaveLength(1);
  });
});
