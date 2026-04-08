import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Server, Terminal, Bot, Wrench } from "lucide-react";

const navItems = [
  { label: "CCNA", path: "/", icon: Terminal, description: "Network Fundamentals", activeClass: "bg-green-600 text-white" },
  { label: "CCNP", path: "/multi-device", icon: Server, description: "Multi-Device Labs", activeClass: "bg-amber-600 text-white" },
  { label: "Automation", path: "/automation", icon: Wrench, description: "Python & Terraform", activeClass: "bg-cyan-600 text-white" },
  { label: "AI Coding", path: "/ai-coding", icon: Bot, description: "AI-Assisted Labs", activeClass: "bg-purple-600 text-white" },
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
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-mono-terminal transition-colors",
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