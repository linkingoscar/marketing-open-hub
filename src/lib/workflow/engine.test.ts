import { describe, it, expect } from "vitest";
import {
  createWorkflow,
  getExecutableSteps,
  getWorkflowProgress,
  WORKFLOW_TEMPLATES,
  type Workflow,
  type WorkflowStep,
} from "./engine";

describe("workflow engine", () => {
  // ===== Template validation =====
  describe("WORKFLOW_TEMPLATES", () => {
    it("has 4 templates", () => {
      expect(WORKFLOW_TEMPLATES).toHaveLength(4);
    });

    it("each template has name, description, and steps", () => {
      for (const template of WORKFLOW_TEMPLATES) {
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.steps.length).toBeGreaterThan(0);
      }
    });

    it("each step has valid id, type, label, and dependsOn", () => {
      for (const template of WORKFLOW_TEMPLATES) {
        const stepIds = new Set(template.steps.map((s) => s.id));
        for (const step of template.steps) {
          expect(step.id).toBeTruthy();
          expect(step.type).toBeTruthy();
          expect(step.label).toBeTruthy();
          expect(Array.isArray(step.dependsOn)).toBe(true);
          // All dependencies reference existing step IDs
          for (const dep of step.dependsOn) {
            expect(stepIds.has(dep)).toBe(true);
          }
        }
      }
    });

    it("valid step types", () => {
      const validTypes = ["literature-search", "data-upload", "statistical-test", "visualization", "ai-analysis", "export"];
      for (const template of WORKFLOW_TEMPLATES) {
        for (const step of template.steps) {
          expect(validTypes).toContain(step.type);
        }
      }
    });
  });

  // ===== createWorkflow =====
  describe("createWorkflow", () => {
    it("creates a workflow from template with unique id", () => {
      const template = WORKFLOW_TEMPLATES[0];
      const wf1 = createWorkflow(template);
      const wf2 = createWorkflow(template);

      expect(wf1.id).toBeTruthy();
      expect(wf1.id).not.toBe(wf2.id);
      expect(wf1.name).toBe(template.name);
      expect(wf1.description).toBe(template.description);
      expect(wf1.status).toBe("draft");
      expect(wf1.createdAt).toBeGreaterThan(0);
      expect(wf1.updatedAt).toBeGreaterThan(0);
    });

    it("all steps start as pending", () => {
      const wf = createWorkflow(WORKFLOW_TEMPLATES[0]);
      for (const step of wf.steps) {
        expect(step.status).toBe("pending");
      }
    });

    it("preserves step structure from template", () => {
      const template = WORKFLOW_TEMPLATES[0];
      const wf = createWorkflow(template);
      expect(wf.steps).toHaveLength(template.steps.length);

      for (let i = 0; i < template.steps.length; i++) {
        expect(wf.steps[i].id).toBe(template.steps[i].id);
        expect(wf.steps[i].type).toBe(template.steps[i].type);
        expect(wf.steps[i].label).toBe(template.steps[i].label);
        expect(wf.steps[i].dependsOn).toEqual(template.steps[i].dependsOn);
      }
    });
  });

  // ===== getExecutableSteps =====
  describe("getExecutableSteps", () => {
    it("returns steps with no dependencies when all steps are pending", () => {
      const wf = createWorkflow(WORKFLOW_TEMPLATES[0]);
      const executable = getExecutableSteps(wf);

      // Steps with no dependencies should be executable
      for (const step of executable) {
        expect(step.dependsOn).toHaveLength(0);
        expect(step.status).toBe("pending");
      }
    });

    it("returns empty when workflow is completed", () => {
      const wf = createWorkflow(WORKFLOW_TEMPLATES[0]);
      wf.steps.forEach((s) => (s.status = "completed"));

      const executable = getExecutableSteps(wf);
      expect(executable).toHaveLength(0);
    });

    it("unblocks dependent steps when dependencies are completed", () => {
      const wf = createWorkflow(WORKFLOW_TEMPLATES[0]);

      // Complete all steps with no dependencies
      const initial = getExecutableSteps(wf);
      for (const step of initial) {
        step.status = "completed";
      }

      // Now dependent steps should become executable
      const next = getExecutableSteps(wf);
      expect(next.length).toBeGreaterThan(0);

      for (const step of next) {
        // All dependencies should be completed
        for (const depId of step.dependsOn) {
          const dep = wf.steps.find((s) => s.id === depId);
          expect(dep?.status).toBe("completed");
        }
      }
    });

    it("does not return failed or running steps", () => {
      const wf = createWorkflow(WORKFLOW_TEMPLATES[0]);

      // Mark first executable step as failed
      const initial = getExecutableSteps(wf);
      if (initial.length > 0) {
        initial[0].status = "failed";
        const executable = getExecutableSteps(wf);
        expect(executable.every((s) => s.status === "pending")).toBe(true);
      }
    });

    it("handles complex dependency chains (brand awareness template)", () => {
      const wf = createWorkflow(WORKFLOW_TEMPLATES[0]); // 品牌认知度研究

      // Step 1: literature-search (no deps) — pending
      // Step 2: data-upload (no deps) — pending
      // Step 3: cronbach (depends on step-2)
      // Step 4: paired-ttest (depends on step-2)
      // Step 5: visualization (depends on step-4)
      // Step 6: export (depends on step-3, step-4, step-5)

      const initial = getExecutableSteps(wf);
      const initialIds = initial.map((s) => s.id);
      expect(initialIds).toContain("step-1");
      expect(initialIds).toContain("step-2");

      // Complete step-2
      const step2 = wf.steps.find((s) => s.id === "step-2")!;
      step2.status = "completed";

      const afterStep2 = getExecutableSteps(wf);
      const afterStep2Ids = afterStep2.map((s) => s.id);
      expect(afterStep2Ids).toContain("step-3");
      expect(afterStep2Ids).toContain("step-4");
      // step-5 should NOT be executable yet (depends on step-4)
      expect(afterStep2Ids).not.toContain("step-5");
    });
  });

  // ===== getWorkflowProgress =====
  describe("getWorkflowProgress", () => {
    it("starts at 0%", () => {
      const wf = createWorkflow(WORKFLOW_TEMPLATES[0]);
      const progress = getWorkflowProgress(wf);

      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(wf.steps.length);
      expect(progress.percentage).toBe(0);
    });

    it("calculates correct percentage", () => {
      const wf = createWorkflow(WORKFLOW_TEMPLATES[0]);
      const total = wf.steps.length;

      // Complete first 2 steps
      wf.steps[0].status = "completed";
      wf.steps[1].status = "completed";

      const progress = getWorkflowProgress(wf);
      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(total);
      expect(progress.percentage).toBe(Math.round((2 / total) * 100));
    });

    it("reaches 100% when all steps completed", () => {
      const wf = createWorkflow(WORKFLOW_TEMPLATES[0]);
      wf.steps.forEach((s) => (s.status = "completed"));

      const progress = getWorkflowProgress(wf);
      expect(progress.completed).toBe(progress.total);
      expect(progress.percentage).toBe(100);
    });

    it("handles 0 steps gracefully", () => {
      const wf = createWorkflow(WORKFLOW_TEMPLATES[0]);
      wf.steps = [];

      const progress = getWorkflowProgress(wf);
      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(0);
      expect(progress.percentage).toBe(0);
    });
  });
});
