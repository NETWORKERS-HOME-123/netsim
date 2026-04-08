import { useWorkspace } from "@/context/WorkspaceContext";
import { ChevronRight } from "lucide-react";
import { LabNavToggle } from "./LabNavToggle";

export function Topbar() {
  const { activeLab } = useWorkspace();

  const breadcrumb = activeLab
    ? `Labs / ${activeLab.category} / ${activeLab.name}`
    : "Labs";

  return (
    <div className="h-14 border-b border-border bg-card flex items-center px-4 gap-4 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-terminal-green animate-glow-pulse" />
        <span className="font-mono-terminal text-sm font-bold tracking-widest text-foreground">
          SIMULATOR
        </span>
      </div>

      {/* Nav Toggle */}
      <div className="ml-4">
        <LabNavToggle />
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
        {breadcrumb.split(" / ").map((part, i, arr) => (
          <span key={i} className="flex items-center gap-1">
            <span className={i === arr.length - 1 ? "text-foreground" : ""}>{part}</span>
            {i < arr.length - 1 && <ChevronRight className="w-3 h-3" />}
          </span>
        ))}
      </div>

      <div className="flex-1" />

      {/* Student Session */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground border-l border-border pl-4">
        <div className="w-2 h-2 rounded-full bg-terminal-green" />
        Student Session
      </div>
    </div>
  );
}
