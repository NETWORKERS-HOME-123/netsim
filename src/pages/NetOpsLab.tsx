import { WorkspaceProvider, useWorkspace } from "@/context/WorkspaceContext";
import { Topbar } from "@/components/simulator/Topbar";
import { CenterPanel } from "@/components/simulator/CenterPanel";
import { RightPanel } from "@/components/simulator/RightPanel";
import { BottomPanel } from "@/components/simulator/BottomPanel";
import { useState, useEffect } from "react";
import { categories, labs } from "@/data/labs";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Search, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

function NetOpsSidebar() {
  const { activeLab, selectLab } = useWorkspace();
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (cat: string) => setCollapsed((p) => ({ ...p, [cat]: !p[cat] }));

  const filtered = categories
    .filter((cat) => cat.name === "Network Operations")
    .map((cat) => ({
      ...cat,
      filteredLabs: cat.labs
        .map((id) => labs.find((l) => l.id === id)!)
        .filter((l) => l && l.name.toLowerCase().includes(search.toLowerCase())),
    }))
    .filter((cat) => cat.filteredLabs.length > 0);

  return (
    <div className="w-[280px] border-r border-border bg-card flex flex-col shrink-0">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search NetOps labs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs bg-secondary border-border font-mono-terminal" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {filtered.map((cat) => {
          const isOpen = !collapsed[cat.name];
          return (
            <div key={cat.name} className="mb-1">
              <button onClick={() => toggle(cat.name)} className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground rounded transition-colors">
                {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {cat.name}
                <span className="ml-auto text-[10px] opacity-50">{cat.filteredLabs.length}</span>
              </button>
              {isOpen && (
                <div className="ml-2 border-l border-border">
                  {cat.filteredLabs.map((lab) => (
                    <button key={lab.id} onClick={() => selectLab(lab)} className={cn("flex items-center gap-2 w-full px-3 py-1.5 text-xs rounded-r transition-colors", activeLab?.id === lab.id ? "bg-primary/10 text-primary border-l-2 border-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
                      <Activity className="w-3 h-3 shrink-0" />
                      {lab.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NetOpsLabInner() {
  const { selectLab } = useWorkspace();
  useEffect(() => {
    const netopsLabs = labs.filter((l) => l.category === "Network Operations");
    if (netopsLabs.length > 0) selectLab(netopsLabs[0]);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <Topbar />
      <div className="flex flex-1 min-h-0">
        <NetOpsSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex flex-1 min-h-0"><CenterPanel /><RightPanel /></div>
          <BottomPanel />
        </div>
      </div>
    </div>
  );
}

export default function NetOpsLabPage() {
  return <WorkspaceProvider><NetOpsLabInner /></WorkspaceProvider>;
}
