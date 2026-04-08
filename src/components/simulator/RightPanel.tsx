import { useWorkspace } from "@/context/WorkspaceContext";

export function RightPanel() {
  const { mode, activeLab } = useWorkspace();

  return (
    <div className="w-[320px] border-l border-border bg-card flex flex-col shrink-0">
      <div className="px-3 py-2 border-b border-border">
        <span className="text-[10px] font-mono-terminal uppercase tracking-wider text-muted-foreground">
          {mode === "Network Lab" && "Topology"}
          {mode === "Python Lab" && "Execution Flow"}
          {mode === "Terraform Lab" && "Infrastructure"}
          {mode === "AI Coding Lab" && "File Structure"}
        </span>
      </div>
      <div className="flex-1 p-3 overflow-y-auto">
        {mode === "Network Lab" && <TopologySvg activeLab={activeLab} />}
        {mode === "Python Lab" && <ExecutionFlowSvg />}
        {mode === "Terraform Lab" && <InfraGraphSvg />}
        {mode === "AI Coding Lab" && <FileTreeView />}
      </div>
    </div>
  );
}

function TopologySvg({ activeLab }: { activeLab: any }) {
  const isSwitch = activeLab?.category === "Switching";
  
  return (
    <svg viewBox="0 0 280 320" className="w-full h-auto">
      {/* Links */}
      <line x1="140" y1="60" x2="60" y2="160" stroke="hsl(142 71% 45%)" strokeWidth="2" opacity="0.6" />
      <line x1="140" y1="60" x2="220" y2="160" stroke="hsl(142 71% 45%)" strokeWidth="2" opacity="0.6" />
      <line x1="60" y1="160" x2="60" y2="260" stroke="hsl(210 100% 56%)" strokeWidth="2" opacity="0.6" />
      <line x1="220" y1="160" x2="220" y2="260" stroke="hsl(210 100% 56%)" strokeWidth="2" opacity="0.6" />
      <line x1="60" y1="260" x2="220" y2="260" stroke="hsl(38 92% 50%)" strokeWidth="2" opacity="0.4" strokeDasharray="4 2" />

      {/* Core Router */}
      <g className="animate-glow-pulse">
        <rect x="115" y="35" width="50" height="50" rx="6" fill="hsl(220 18% 12%)" stroke="hsl(142 71% 45%)" strokeWidth="2" />
        <text x="140" y="55" textAnchor="middle" fill="hsl(142 71% 45%)" fontSize="8" fontFamily="monospace">R1</text>
        <text x="140" y="72" textAnchor="middle" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">Core</text>
      </g>

      {/* Switch 1 */}
      <rect x="35" y="135" width="50" height="50" rx="6" fill="hsl(220 18% 12%)" stroke="hsl(210 100% 56%)" strokeWidth="1.5" />
      <text x="60" y="155" textAnchor="middle" fill="hsl(210 100% 56%)" fontSize="8" fontFamily="monospace">{isSwitch ? "SW1" : "R2"}</text>
      <text x="60" y="172" textAnchor="middle" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">{isSwitch ? "Access" : "Branch"}</text>

      {/* Switch 2 */}
      <rect x="195" y="135" width="50" height="50" rx="6" fill="hsl(220 18% 12%)" stroke="hsl(210 100% 56%)" strokeWidth="1.5" />
      <text x="220" y="155" textAnchor="middle" fill="hsl(210 100% 56%)" fontSize="8" fontFamily="monospace">{isSwitch ? "SW2" : "R3"}</text>
      <text x="220" y="172" textAnchor="middle" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">{isSwitch ? "Dist" : "Branch"}</text>

      {/* End devices */}
      <circle cx="60" cy="260" r="18" fill="hsl(220 18% 12%)" stroke="hsl(215 12% 55%)" strokeWidth="1" />
      <text x="60" y="263" textAnchor="middle" fill="hsl(215 12% 55%)" fontSize="7" fontFamily="monospace">PC1</text>

      <circle cx="220" cy="260" r="18" fill="hsl(220 18% 12%)" stroke="hsl(215 12% 55%)" strokeWidth="1" />
      <text x="220" y="263" textAnchor="middle" fill="hsl(215 12% 55%)" fontSize="7" fontFamily="monospace">PC2</text>

      {/* Legend */}
      <g transform="translate(10, 300)">
        <circle cx="8" cy="6" r="3" fill="hsl(142 71% 45%)" />
        <text x="16" y="9" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">Active</text>
        <circle cx="58" cy="6" r="3" fill="hsl(210 100% 56%)" />
        <text x="66" y="9" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">Up</text>
        <circle cx="98" cy="6" r="3" fill="hsl(38 92% 50%)" />
        <text x="106" y="9" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">Backup</text>
      </g>
    </svg>
  );
}

function ExecutionFlowSvg() {
  const steps = [
    { label: "Import Netmiko", y: 30 },
    { label: "Define Device", y: 75 },
    { label: "ConnectHandler()", y: 120 },
    { label: "send_command()", y: 165 },
    { label: "Process Output", y: 210 },
    { label: "disconnect()", y: 255 },
  ];

  return (
    <svg viewBox="0 0 280 300" className="w-full h-auto">
      {steps.map((step, i) => (
        <g key={i}>
          {i > 0 && (
            <line x1="140" y1={steps[i - 1].y + 18} x2="140" y2={step.y - 5} stroke="hsl(210 100% 56%)" strokeWidth="1.5" opacity="0.5" />
          )}
          <rect x="40" y={step.y - 5} width="200" height="28" rx="4" fill="hsl(220 18% 12%)" stroke="hsl(210 100% 56% / 0.3)" strokeWidth="1" />
          <circle cx="55" cy={step.y + 9} r="6" fill={i <= 2 ? "hsl(142 71% 45%)" : "hsl(220 14% 18%)"} stroke="hsl(210 100% 56% / 0.5)" strokeWidth="1" />
          <text x="55" y={step.y + 12} textAnchor="middle" fill="hsl(0 0% 100%)" fontSize="7" fontFamily="monospace">{i + 1}</text>
          <text x="75" y={step.y + 13} fill="hsl(210 20% 90%)" fontSize="9" fontFamily="monospace">{step.label}</text>
        </g>
      ))}
    </svg>
  );
}

function InfraGraphSvg() {
  return (
    <svg viewBox="0 0 280 280" className="w-full h-auto">
      {/* VPC */}
      <rect x="20" y="10" width="240" height="260" rx="8" fill="none" stroke="hsl(210 100% 56% / 0.3)" strokeWidth="1" strokeDasharray="4 2" />
      <text x="30" y="28" fill="hsl(210 100% 56%)" fontSize="9" fontFamily="monospace">VPC — 10.0.0.0/16</text>

      {/* Subnet A */}
      <rect x="30" y="40" width="105" height="90" rx="4" fill="hsl(220 18% 10%)" stroke="hsl(142 71% 45% / 0.4)" strokeWidth="1" />
      <text x="40" y="55" fill="hsl(142 71% 45%)" fontSize="8" fontFamily="monospace">Subnet A</text>
      <text x="40" y="66" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">10.0.1.0/24 (public)</text>

      <rect x="45" y="78" width="75" height="22" rx="3" fill="hsl(220 14% 14%)" stroke="hsl(210 100% 56% / 0.3)" strokeWidth="1" />
      <text x="82" y="92" textAnchor="middle" fill="hsl(210 20% 90%)" fontSize="7" fontFamily="monospace">web-server-1</text>

      <rect x="45" y="104" width="75" height="22" rx="3" fill="hsl(220 14% 14%)" stroke="hsl(210 100% 56% / 0.3)" strokeWidth="1" />
      <text x="82" y="118" textAnchor="middle" fill="hsl(210 20% 90%)" fontSize="7" fontFamily="monospace">web-server-2</text>

      {/* Subnet B */}
      <rect x="145" y="40" width="105" height="90" rx="4" fill="hsl(220 18% 10%)" stroke="hsl(38 92% 50% / 0.4)" strokeWidth="1" />
      <text x="155" y="55" fill="hsl(38 92% 50%)" fontSize="8" fontFamily="monospace">Subnet B</text>
      <text x="155" y="66" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">10.0.2.0/24 (private)</text>

      <rect x="160" y="78" width="75" height="22" rx="3" fill="hsl(220 14% 14%)" stroke="hsl(38 92% 50% / 0.3)" strokeWidth="1" />
      <text x="197" y="92" textAnchor="middle" fill="hsl(210 20% 90%)" fontSize="7" fontFamily="monospace">db-primary</text>

      <rect x="160" y="104" width="75" height="22" rx="3" fill="hsl(220 14% 14%)" stroke="hsl(38 92% 50% / 0.3)" strokeWidth="1" />
      <text x="197" y="118" textAnchor="middle" fill="hsl(210 20% 90%)" fontSize="7" fontFamily="monospace">db-replica</text>

      {/* IGW */}
      <rect x="85" y="155" width="110" height="30" rx="4" fill="hsl(220 18% 12%)" stroke="hsl(210 100% 56%)" strokeWidth="1.5" />
      <text x="140" y="174" textAnchor="middle" fill="hsl(210 100% 56%)" fontSize="8" fontFamily="monospace">Internet Gateway</text>

      {/* Lines */}
      <line x1="82" y1="130" x2="120" y2="155" stroke="hsl(142 71% 45% / 0.5)" strokeWidth="1" />
      <line x1="197" y1="130" x2="160" y2="155" stroke="hsl(38 92% 50% / 0.5)" strokeWidth="1" strokeDasharray="3 2" />

      {/* Security Group */}
      <rect x="60" y="200" width="160" height="55" rx="4" fill="hsl(220 18% 10%)" stroke="hsl(0 72% 51% / 0.3)" strokeWidth="1" />
      <text x="70" y="215" fill="hsl(0 72% 51%)" fontSize="8" fontFamily="monospace">Security Group</text>
      <text x="70" y="228" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">→ Allow 80, 443 inbound</text>
      <text x="70" y="239" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">→ Allow 5432 from Subnet A</text>
      <text x="70" y="250" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">→ Deny all other</text>

      <line x1="140" y1="185" x2="140" y2="200" stroke="hsl(210 100% 56% / 0.3)" strokeWidth="1" />
    </svg>
  );
}

function FileTreeView() {
  const files = [
    { name: "src/", depth: 0, type: "dir" },
    { name: "components/", depth: 1, type: "dir" },
    { name: "App.tsx", depth: 2, type: "file", active: true },
    { name: "Header.tsx", depth: 2, type: "file" },
    { name: "Sidebar.tsx", depth: 2, type: "file" },
    { name: "hooks/", depth: 1, type: "dir" },
    { name: "useAuth.ts", depth: 2, type: "file" },
    { name: "utils/", depth: 1, type: "dir" },
    { name: "api.ts", depth: 2, type: "file" },
    { name: "helpers.ts", depth: 2, type: "file" },
    { name: "index.tsx", depth: 1, type: "file" },
    { name: "package.json", depth: 0, type: "file" },
    { name: "tsconfig.json", depth: 0, type: "file" },
  ];

  return (
    <div className="font-mono-terminal text-xs space-y-0.5">
      {files.map((f, i) => (
        <div
          key={i}
          className={`flex items-center gap-1.5 py-0.5 px-1 rounded ${f.active ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
          style={{ paddingLeft: `${f.depth * 16 + 4}px` }}
        >
          <span className="text-[10px]">{f.type === "dir" ? "📁" : "📄"}</span>
          <span>{f.name}</span>
          {f.active && <span className="ml-auto text-[10px] text-primary">●</span>}
        </div>
      ))}
    </div>
  );
}
