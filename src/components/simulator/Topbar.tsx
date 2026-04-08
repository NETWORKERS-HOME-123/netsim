import { useWorkspace } from "@/context/WorkspaceContext";
import { ChevronRight, Server } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { LabMode } from "@/data/labs";

const modes: LabMode[] = ["Network Lab", "Python Lab", "Terraform Lab", "AI Coding Lab"];

export function Topbar() {
  const { mode, setMode, activeLab } = useWorkspace();

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

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-4">
        {breadcrumb.split(" / ").map((part, i, arr) => (
          <span key={i} className="flex items-center gap-1">
            <span className={i === arr.length - 1 ? "text-foreground" : ""}>{part}</span>
            {i < arr.length - 1 && <ChevronRight className="w-3 h-3" />}
          </span>
        ))}
      </div>

      <div className="flex-1" />

      {/* Lab Mode Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="font-mono-terminal text-xs h-8 bg-secondary border-border">
            {mode}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover border-border">
          {modes.map((m) => (
            <DropdownMenuItem
              key={m}
              onClick={() => setMode(m)}
              className={`font-mono-terminal text-xs ${m === mode ? "text-primary" : ""}`}
            >
              {m}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Multi-Device Labs link */}
      <Link
        to="/multi-device"
        className="flex items-center gap-1.5 text-xs font-mono-terminal text-muted-foreground hover:text-terminal-cyan transition-colors border-l border-border pl-4"
      >
        <Server className="w-3 h-3" />
        Multi-Device Labs
      </Link>

      {/* Student Session */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground border-l border-border pl-4">
        <div className="w-2 h-2 rounded-full bg-terminal-green" />
        Student Session
      </div>
    </div>
  );
}
