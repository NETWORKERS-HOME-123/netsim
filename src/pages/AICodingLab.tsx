import { WorkspaceProvider, useWorkspace } from "@/context/WorkspaceContext";
import { Topbar } from "@/components/simulator/Topbar";
import { CenterPanel } from "@/components/simulator/CenterPanel";
import { RightPanel } from "@/components/simulator/RightPanel";
import { BottomPanel } from "@/components/simulator/BottomPanel";
import { useState, useEffect } from "react";
import { categories, labs } from "@/data/labs";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Search, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lab } from "@/data/labs";

function AICodingSidebar() {
  const { activeLab, selectLab } = useWorkspace();
  const [search, setSearch] = useState("");

  const aiLabs = labs
    .filter((l) => l.mode === "AI Coding Lab")
    .filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-[280px] border-r border-border bg-card flex flex-col shrink-0">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search AI coding labs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-secondary border-border font-mono-terminal"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-1">
          <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            <Bot className="w-3 h-3" />
            AI Coding Labs
            <span className="ml-auto text-[10px] opacity-50">{aiLabs.length}</span>
          </div>
          <div className="ml-2 border-l border-border">
            {aiLabs.map((lab) => {
              const isActive = activeLab?.id === lab.id;
              return (
                <button
                  key={lab.id}
                  onClick={() => selectLab(lab)}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-1.5 text-xs rounded-r transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Bot className="w-3 h-3 shrink-0" />
                  {lab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function AICodingLabInner() {
  const { selectLab } = useWorkspace();

  useEffect(() => {
    const aiLabs = labs.filter((l) => l.mode === "AI Coding Lab");
    if (aiLabs.length > 0) selectLab(aiLabs[0]);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <Topbar />
      <div className="flex flex-1 min-h-0">
        <AICodingSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex flex-1 min-h-0">
            <CenterPanel />
            <RightPanel />
          </div>
          <BottomPanel />
        </div>
      </div>
    </div>
  );
}

export default function AICodingLabPage() {
  return (
    <WorkspaceProvider>
      <AICodingLabInner />
    </WorkspaceProvider>
  );
}
