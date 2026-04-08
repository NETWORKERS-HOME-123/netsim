import { useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { categories, labs } from "@/data/labs";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Search, Terminal, Code, Cloud, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabMode } from "@/data/labs";

const modeIcons: Record<LabMode, React.ElementType> = {
  "Network Lab": Terminal,
  "Python Lab": Code,
  "Terraform Lab": Cloud,
  "AI Coding Lab": Bot,
};

export function LabSidebar() {
  const { activeLab, selectLab } = useWorkspace();
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (cat: string) =>
    setCollapsed((p) => ({ ...p, [cat]: !p[cat] }));

  const filteredCategories = categories
    .map((cat) => {
      const catLabs = cat.labs
        .map((id) => labs.find((l) => l.id === id)!)
        .filter((l) => l && l.name.toLowerCase().includes(search.toLowerCase()));
      return { ...cat, filteredLabs: catLabs };
    })
    .filter((cat) => cat.filteredLabs.length > 0);

  return (
    <div className="w-[280px] border-r border-border bg-card flex flex-col shrink-0">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search labs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-secondary border-border font-mono-terminal"
          />
        </div>
      </div>

      {/* Category Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredCategories.map((cat) => {
          const isOpen = !collapsed[cat.name];
          return (
            <div key={cat.name} className="mb-1">
              <button
                onClick={() => toggle(cat.name)}
                className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground rounded transition-colors"
              >
                {isOpen ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                {cat.name}
                <span className="ml-auto text-[10px] opacity-50">
                  {cat.filteredLabs.length}
                </span>
              </button>
              {isOpen && (
                <div className="ml-2 border-l border-border">
                  {cat.filteredLabs.map((lab) => {
                    const Icon = modeIcons[lab.mode];
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
                        <Icon className="w-3 h-3 shrink-0" />
                        {lab.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
