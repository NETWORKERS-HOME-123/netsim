import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Server, Terminal, Bot, Wrench } from "lucide-react";

const navItems = [
  { label: "CCNA", path: "/", icon: Terminal, description: "Network Fundamentals" },
  { label: "CCNP", path: "/multi-device", icon: Server, description: "Multi-Device Labs" },
  { label: "Automation", path: "/automation", icon: Wrench, description: "Python & Terraform" },
  { label: "AI Coding", path: "/ai-coding", icon: Bot, description: "AI-Assisted Labs" },
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
                ? "bg-primary text-primary-foreground"
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
