import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Server, Terminal, Bot, Wrench, Activity, Shield, Lock, Cloud, FileSearch } from "lucide-react";

const navItems = [
  { label: "CCNA", path: "/", icon: Terminal, activeClass: "bg-green-600 text-white" },
  { label: "CCNP", path: "/multi-device", icon: Server, activeClass: "bg-amber-600 text-white" },
  { label: "Automation", path: "/automation", icon: Wrench, activeClass: "bg-cyan-600 text-white" },
  { label: "AI Coding", path: "/ai-coding", icon: Bot, activeClass: "bg-purple-600 text-white" },
  { label: "NetOps", path: "/netops", icon: Activity, activeClass: "bg-blue-600 text-white" },
  { label: "Security", path: "/security", icon: Shield, activeClass: "bg-red-600 text-white" },
  { label: "Py SecOps", path: "/python-secops", icon: Lock, activeClass: "bg-teal-600 text-white" },
  { label: "Cloud", path: "/cloud", icon: Cloud, activeClass: "bg-indigo-600 text-white" },
  { label: "Forensics", path: "/forensics", icon: FileSearch, activeClass: "bg-orange-600 text-white" },
];

export function LabNavToggle() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex rounded-lg overflow-hidden border border-border">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold font-mono-terminal transition-colors",
              isActive
                ? item.activeClass
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-3 h-3" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}