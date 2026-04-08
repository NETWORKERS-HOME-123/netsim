import { useWorkspace } from "@/context/WorkspaceContext";
import { TerminalView } from "./TerminalView";
import { CodeEditorView } from "./CodeEditorView";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, RotateCcw, Rocket, Zap, RefreshCw } from "lucide-react";

export function CenterPanel() {
  const { mode, activeLab, simState, startSim, pauseSim, stepSim, resetSim } = useWorkspace();

  if (!activeLab) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <div className="font-mono-terminal text-lg mb-2">Select a lab to begin</div>
          <div className="text-xs">Choose from the sidebar on the left</div>
        </div>
      </div>
    );
  }

  const renderControls = () => {
    if (mode === "Network Lab") {
      return (
        <>
          <Button size="sm" variant="outline" onClick={startSim} disabled={simState === "running"} className="h-7 text-xs gap-1.5 bg-secondary border-border">
            <Play className="w-3 h-3" /> Start
          </Button>
          <Button size="sm" variant="outline" onClick={pauseSim} disabled={simState !== "running"} className="h-7 text-xs gap-1.5 bg-secondary border-border">
            <Pause className="w-3 h-3" /> Pause
          </Button>
          <Button size="sm" variant="outline" onClick={stepSim} disabled={simState === "running"} className="h-7 text-xs gap-1.5 bg-secondary border-border">
            <SkipForward className="w-3 h-3" /> Step
          </Button>
          <Button size="sm" variant="outline" onClick={resetSim} className="h-7 text-xs gap-1.5 bg-secondary border-border">
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
        </>
      );
    }
    if (mode === "Python Lab") {
      return (
        <>
          <Button size="sm" variant="outline" onClick={startSim} disabled={simState === "running"} className="h-7 text-xs gap-1.5 bg-secondary border-border">
            <Play className="w-3 h-3" /> Run Script
          </Button>
          <Button size="sm" variant="outline" onClick={stepSim} disabled={simState === "running"} className="h-7 text-xs gap-1.5 bg-secondary border-border">
            <SkipForward className="w-3 h-3" /> Step Execution
          </Button>
          <Button size="sm" variant="outline" onClick={resetSim} className="h-7 text-xs gap-1.5 bg-secondary border-border">
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
        </>
      );
    }
    if (mode === "Terraform Lab") {
      return (
        <>
          <Button size="sm" variant="outline" onClick={resetSim} className="h-7 text-xs gap-1.5 bg-secondary border-border">
            <RefreshCw className="w-3 h-3" /> Init
          </Button>
          <Button size="sm" variant="outline" onClick={startSim} disabled={simState === "running"} className="h-7 text-xs gap-1.5 bg-secondary border-border">
            <Zap className="w-3 h-3" /> Plan
          </Button>
          <Button size="sm" variant="outline" onClick={startSim} disabled={simState === "running"} className="h-7 text-xs gap-1.5 bg-secondary border-border">
            <Rocket className="w-3 h-3" /> Apply
          </Button>
        </>
      );
    }
    // AI Coding Lab
    return (
      <>
        <Button size="sm" variant="outline" onClick={startSim} disabled={simState === "running"} className="h-7 text-xs gap-1.5 bg-secondary border-border">
          <Zap className="w-3 h-3" /> Generate Code
        </Button>
        <Button size="sm" variant="outline" onClick={resetSim} className="h-7 text-xs gap-1.5 bg-secondary border-border">
          <RotateCcw className="w-3 h-3" /> Reset
        </Button>
      </>
    );
  };

  const renderWorkspace = () => {
    if (mode === "Network Lab") return <TerminalView />;
    return <CodeEditorView />;
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Objective bar */}
      <div className="px-4 py-2 border-b border-border bg-card flex items-center gap-3 shrink-0">
        <span className="text-[10px] font-mono-terminal uppercase tracking-wider text-muted-foreground">Objective</span>
        <span className="text-xs text-foreground">{activeLab.objective}</span>
      </div>

      {/* Controls */}
      <div className="px-4 py-2 border-b border-border bg-card flex items-center gap-2 shrink-0">
        {renderControls()}
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono-terminal">
          <span className={`w-1.5 h-1.5 rounded-full ${simState === "running" ? "bg-terminal-green animate-glow-pulse" : simState === "complete" ? "bg-terminal-green" : "bg-muted-foreground"}`} />
          {simState.toUpperCase()}
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 p-2 overflow-hidden">
        {renderWorkspace()}
      </div>
    </div>
  );
}
