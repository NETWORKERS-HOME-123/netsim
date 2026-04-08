import React, { createContext, useContext, useState, useCallback } from "react";
import type { Lab, LabMode } from "@/data/labs";
import { labs } from "@/data/labs";

type SimState = "idle" | "running" | "paused" | "complete";

interface WorkspaceState {
  mode: LabMode;
  activeLab: Lab | null;
  simState: SimState;
  currentStep: number;
  setMode: (m: LabMode) => void;
  selectLab: (lab: Lab) => void;
  startSim: () => void;
  pauseSim: () => void;
  stepSim: () => void;
  resetSim: () => void;
  completeSim: () => void;
  setCurrentStep: (n: number) => void;
}

const WorkspaceContext = createContext<WorkspaceState | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeRaw] = useState<LabMode>("Network Lab");
  const [activeLab, setActiveLab] = useState<Lab | null>(labs[0]);
  const [simState, setSimState] = useState<SimState>("idle");
  const [currentStep, setCurrentStep] = useState(0);

  const setMode = useCallback((m: LabMode) => {
    setModeRaw(m);
  }, []);

  const selectLab = useCallback((lab: Lab) => {
    setActiveLab(lab);
    setModeRaw(lab.mode);
    setSimState("idle");
    setCurrentStep(0);
  }, []);

  const startSim = useCallback(() => setSimState("running"), []);
  const pauseSim = useCallback(() => setSimState("paused"), []);
  const completeSim = useCallback(() => setSimState("complete"), []);
  const resetSim = useCallback(() => {
    setSimState("idle");
    setCurrentStep(0);
  }, []);
  const stepSim = useCallback(() => {
    setSimState("paused");
    setCurrentStep((p) => p + 1);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{ mode, activeLab, simState, currentStep, setMode, selectLab, startSim, pauseSim, stepSim, resetSim, completeSim, setCurrentStep }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
