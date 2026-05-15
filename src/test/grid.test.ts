import { describe, expect, it } from "vitest";
import { bandExpectedHours, statusToColor } from "@/hooks/useGridData";

describe("statusToColor", () => {
  it("maps known statuses to UI colors", () => {
    expect(statusToColor("POWER_AVAILABLE")).toBe("green");
    expect(statusToColor("OUTAGE")).toBe("red");
    expect(statusToColor("INTERMITTENT")).toBe("yellow");
    expect(statusToColor("UNKNOWN")).toBe("gray");
  });
});

describe("bandExpectedHours", () => {
  it("returns NERC band supply hours", () => {
    expect(bandExpectedHours("A")).toBe(20);
    expect(bandExpectedHours("E")).toBe(4);
    expect(bandExpectedHours("Z")).toBe(0);
  });
});
