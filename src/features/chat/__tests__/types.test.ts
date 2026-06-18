import { describe, it, expect } from "vitest";
import { createInitialState } from "../types";

describe("chat types", () => {
  describe("createInitialState", () => {
    it("should return idle state with empty cache", () => {
      const state = createInitialState();
      expect(state).toEqual({
        step: "idle",
        cache: {},
      });
    });

    it("should return a fresh object each call", () => {
      const state1 = createInitialState();
      const state2 = createInitialState();
      expect(state1).not.toBe(state2);
    });
  });
});
