import { useWorkspace } from "@/context/WorkspaceContext";
import type { CommandStep, Lab } from "@/data/labs";
import { useMemo } from "react";

export function RightPanel() {
  const { mode, activeLab, currentStep, simState } = useWorkspace();

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
        {mode === "Network Lab" && <TopologySvg activeLab={activeLab} currentStep={currentStep} simState={simState} />}
        {mode === "Python Lab" && <ExecutionFlowSvg currentStep={currentStep} simState={simState} />}
        {mode === "Terraform Lab" && <InfraGraphSvg currentStep={currentStep} simState={simState} />}
        {mode === "AI Coding Lab" && <FileTreeView />}
      </div>
    </div>
  );
}

// --- Topology helpers ---

interface DeviceNode {
  id: string;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  shape: "rect" | "circle";
}

interface Link {
  from: string;
  to: string;
  style?: "solid" | "dashed";
}

function getTopologyForLab(lab: Lab | null): { devices: DeviceNode[]; links: Link[] } {
  const cat = lab?.category ?? "";
  const isSwitch = ["Switching", "Switching Advanced"].includes(cat);
  const isIPv6 = cat === "IPv6";
  const isHA = cat === "High Availability";
  const isSecurity = cat === "Security";

  if (isSwitch) {
    return {
      devices: [
        { id: "sw1", label: "SW1", sublabel: "Core", x: 140, y: 45, shape: "rect" },
        { id: "sw2", label: "SW2", sublabel: "Access-A", x: 60, y: 150, shape: "rect" },
        { id: "sw3", label: "SW3", sublabel: "Access-B", x: 220, y: 150, shape: "rect" },
        { id: "pc1", label: "PC1", sublabel: "VLAN 10", x: 60, y: 255, shape: "circle" },
        { id: "pc2", label: "PC2", sublabel: "VLAN 20", x: 220, y: 255, shape: "circle" },
      ],
      links: [
        { from: "sw1", to: "sw2" },
        { from: "sw1", to: "sw3" },
        { from: "sw2", to: "pc1" },
        { from: "sw3", to: "pc2" },
        { from: "sw2", to: "sw3", style: "dashed" },
      ],
    };
  }

  if (isHA) {
    return {
      devices: [
        { id: "r1", label: "R1", sublabel: "Primary", x: 80, y: 45, shape: "rect" },
        { id: "r2", label: "R2", sublabel: "Standby", x: 200, y: 45, shape: "rect" },
        { id: "sw1", label: "SW1", sublabel: "LAN", x: 140, y: 150, shape: "rect" },
        { id: "pc1", label: "PC1", sublabel: "Client", x: 60, y: 255, shape: "circle" },
        { id: "pc2", label: "PC2", sublabel: "Client", x: 220, y: 255, shape: "circle" },
      ],
      links: [
        { from: "r1", to: "sw1" },
        { from: "r2", to: "sw1" },
        { from: "r1", to: "r2", style: "dashed" },
        { from: "sw1", to: "pc1" },
        { from: "sw1", to: "pc2" },
      ],
    };
  }

  // Default: router-centric topology
  return {
    devices: [
      { id: "r1", label: "R1", sublabel: "Core", x: 140, y: 45, shape: "rect" },
      { id: "r2", label: isIPv6 ? "R2-v6" : "R2", sublabel: "Branch-A", x: 60, y: 150, shape: "rect" },
      { id: "r3", label: isSecurity ? "FW" : "R3", sublabel: isSecurity ? "Firewall" : "Branch-B", x: 220, y: 150, shape: "rect" },
      { id: "pc1", label: "PC1", sublabel: "Host", x: 60, y: 255, shape: "circle" },
      { id: "pc2", label: "PC2", sublabel: "Host", x: 220, y: 255, shape: "circle" },
    ],
    links: [
      { from: "r1", to: "r2" },
      { from: "r1", to: "r3" },
      { from: "r2", to: "pc1" },
      { from: "r3", to: "pc2" },
      { from: "pc1", to: "pc2", style: "dashed" },
    ],
  };
}

/** Detect which device is "active" based on the current command's prompt text */
function detectActiveDevice(lab: Lab | null, step: number): string | null {
  if (!lab) return null;
  const steps = lab.steps as CommandStep[];
  if (!steps.length) return null;

  // Look at current step's command or the previous step's output for prompt context
  const idx = Math.min(step, steps.length - 1);
  const cmd = steps[idx]?.command ?? "";
  const prevOutputs = idx > 0 ? steps[idx - 1]?.output ?? [] : [];
  const lastOutput = prevOutputs[prevOutputs.length - 1] ?? "";

  const combined = (cmd + " " + lastOutput).toLowerCase();

  if (combined.includes("sw3") || combined.includes("switch3")) return "sw3";
  if (combined.includes("sw2") || combined.includes("switch2")) return "sw2";
  if (combined.includes("sw1") || combined.includes("switch1")) return "sw1";
  if (combined.includes("router2") || combined.includes("r2")) return "r2";
  if (combined.includes("router3") || combined.includes("r3")) return "r3";
  if (combined.includes("fw") || combined.includes("firewall")) return "r3";

  // Default: the primary device
  return lab.category?.includes("Switch") ? "sw1" : "r1";
}

function TopologySvg({ activeLab, currentStep, simState }: { activeLab: Lab | null; currentStep: number; simState: string }) {
  const { devices, links } = useMemo(() => getTopologyForLab(activeLab), [activeLab?.id, activeLab?.category]);
  const activeDeviceId = useMemo(() => detectActiveDevice(activeLab, currentStep), [activeLab, currentStep]);

  const isRunning = simState === "running";
  const isComplete = simState === "complete";

  const deviceMap = useMemo(() => {
    const m: Record<string, DeviceNode> = {};
    devices.forEach((d) => (m[d.id] = d));
    return m;
  }, [devices]);

  return (
    <svg viewBox="0 0 280 320" className="w-full h-auto">
      <defs>
        <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        {/* Animated dash for active links */}
        <style>{`
          @keyframes dash-flow {
            to { stroke-dashoffset: -20; }
          }
          .link-active {
            animation: dash-flow 1s linear infinite;
          }
        `}</style>
      </defs>

      {/* Links */}
      {links.map((link, i) => {
        const from = deviceMap[link.from];
        const to = deviceMap[link.to];
        if (!from || !to) return null;

        const isActiveLink = activeDeviceId === link.from || activeDeviceId === link.to;
        const linkColor = isComplete
          ? "hsl(142 71% 45%)"
          : isActiveLink && isRunning
          ? "hsl(142 71% 45%)"
          : "hsl(210 100% 56%)";
        const opacity = isActiveLink || isComplete ? 0.8 : 0.3;

        return (
          <line
            key={i}
            x1={from.x} y1={from.y + (from.shape === "rect" ? 25 : 0)}
            x2={to.x} y2={to.y - (to.shape === "rect" ? 0 : 0) + (to.shape === "circle" ? -18 : 0)}
            stroke={linkColor}
            strokeWidth={isActiveLink && isRunning ? 2.5 : 1.5}
            opacity={opacity}
            strokeDasharray={link.style === "dashed" ? "4 2" : isActiveLink && isRunning ? "6 4" : "none"}
            className={isActiveLink && isRunning ? "link-active" : ""}
          />
        );
      })}

      {/* Devices */}
      {devices.map((device) => {
        const isActive = device.id === activeDeviceId;
        const borderColor = isComplete
          ? "hsl(142 71% 45%)"
          : isActive
          ? "hsl(142 71% 45%)"
          : "hsl(210 100% 56%)";
        const textColor = isComplete
          ? "hsl(142 71% 45%)"
          : isActive
          ? "hsl(142 71% 45%)"
          : "hsl(210 100% 56%)";
        const strokeWidth = isActive ? 2.5 : 1.5;
        const filter = isActive && isRunning ? "url(#glow-green)" : undefined;

        if (device.shape === "circle") {
          return (
            <g key={device.id} filter={filter} className={isActive && isRunning ? "animate-glow-pulse" : ""}>
              <circle cx={device.x} cy={device.y} r="18" fill="hsl(220 18% 12%)" stroke={borderColor} strokeWidth={strokeWidth} />
              <text x={device.x} y={device.y + 3} textAnchor="middle" fill={textColor} fontSize="7" fontFamily="monospace">{device.label}</text>
              <text x={device.x} y={device.y + 30} textAnchor="middle" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">{device.sublabel}</text>
            </g>
          );
        }

        return (
          <g key={device.id} filter={filter} className={isActive && isRunning ? "animate-glow-pulse" : ""}>
            <rect x={device.x - 25} y={device.y - 10} width="50" height="50" rx="6" fill="hsl(220 18% 12%)" stroke={borderColor} strokeWidth={strokeWidth} />
            <text x={device.x} y={device.y + 10} textAnchor="middle" fill={textColor} fontSize="8" fontFamily="monospace">{device.label}</text>
            <text x={device.x} y={device.y + 24} textAnchor="middle" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">{device.sublabel}</text>
            {/* Active indicator dot */}
            {isActive && (
              <circle cx={device.x + 20} cy={device.y - 5} r="3" fill="hsl(142 71% 45%)" className={isRunning ? "animate-glow-pulse" : ""} />
            )}
          </g>
        );
      })}

      {/* Legend */}
      <g transform="translate(10, 300)">
        <circle cx="8" cy="6" r="3" fill="hsl(142 71% 45%)" />
        <text x="16" y="9" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">Active</text>
        <circle cx="58" cy="6" r="3" fill="hsl(210 100% 56%)" />
        <text x="66" y="9" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">Idle</text>
        <rect x="90" y="2" width="12" height="8" rx="1" fill="none" stroke="hsl(142 71% 45%)" strokeWidth="1" />
        <text x="106" y="9" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">Complete</text>
      </g>

      {/* Step indicator */}
      {activeLab && (
        <text x="270" y="12" textAnchor="end" fill="hsl(215 12% 55%)" fontSize="7" fontFamily="monospace">
          Step {Math.min(currentStep + 1, (activeLab.steps as CommandStep[]).length)}/{(activeLab.steps as CommandStep[]).length}
        </text>
      )}
    </svg>
  );
}

function ExecutionFlowSvg({ currentStep, simState }: { currentStep: number; simState: string }) {
  const steps = [
    { label: "Import Netmiko", y: 30 },
    { label: "Define Device", y: 75 },
    { label: "ConnectHandler()", y: 120 },
    { label: "send_command()", y: 165 },
    { label: "Process Output", y: 210 },
    { label: "disconnect()", y: 255 },
  ];

  const isComplete = simState === "complete";

  return (
    <svg viewBox="0 0 280 300" className="w-full h-auto">
      {steps.map((step, i) => {
        const isActive = i === currentStep && simState === "running";
        const isDone = isComplete || i < currentStep;

        return (
          <g key={i}>
            {i > 0 && (
              <line
                x1="140" y1={steps[i - 1].y + 18} x2="140" y2={step.y - 5}
                stroke={isDone ? "hsl(142 71% 45%)" : "hsl(210 100% 56%)"}
                strokeWidth="1.5"
                opacity={isDone ? 0.8 : 0.3}
              />
            )}
            <rect
              x="40" y={step.y - 5} width="200" height="28" rx="4"
              fill={isActive ? "hsl(142 71% 45% / 0.1)" : "hsl(220 18% 12%)"}
              stroke={isActive ? "hsl(142 71% 45%)" : isDone ? "hsl(142 71% 45% / 0.5)" : "hsl(210 100% 56% / 0.3)"}
              strokeWidth={isActive ? 2 : 1}
            />
            <circle
              cx="55" cy={step.y + 9} r="6"
              fill={isDone ? "hsl(142 71% 45%)" : isActive ? "hsl(142 71% 45%)" : "hsl(220 14% 18%)"}
              stroke={isActive ? "hsl(142 71% 45%)" : "hsl(210 100% 56% / 0.5)"}
              strokeWidth="1"
              className={isActive ? "animate-glow-pulse" : ""}
            />
            <text x="55" y={step.y + 12} textAnchor="middle" fill="hsl(0 0% 100%)" fontSize="7" fontFamily="monospace">
              {isDone ? "✓" : i + 1}
            </text>
            <text x="75" y={step.y + 13} fill={isActive ? "hsl(142 71% 45%)" : isDone ? "hsl(210 20% 90%)" : "hsl(215 12% 55%)"} fontSize="9" fontFamily="monospace">
              {step.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function InfraGraphSvg({ currentStep, simState }: { currentStep: number; simState: string }) {
  const isComplete = simState === "complete";
  const isRunning = simState === "running";

  // Map steps to infrastructure components
  const activeComponent = isRunning
    ? currentStep <= 1 ? "vpc" : currentStep <= 3 ? "subnet" : currentStep <= 5 ? "instance" : "sg"
    : null;

  const highlight = (component: string) => {
    if (isComplete) return { stroke: "hsl(142 71% 45%)", opacity: 0.8 };
    if (activeComponent === component) return { stroke: "hsl(142 71% 45%)", opacity: 1 };
    return { stroke: undefined, opacity: undefined };
  };

  return (
    <svg viewBox="0 0 280 280" className="w-full h-auto">
      {/* VPC */}
      <rect
        x="20" y="10" width="240" height="260" rx="8" fill="none"
        stroke={highlight("vpc").stroke ?? "hsl(210 100% 56% / 0.3)"}
        strokeWidth={activeComponent === "vpc" ? 2 : 1}
        strokeDasharray="4 2"
        className={activeComponent === "vpc" && isRunning ? "animate-glow-pulse" : ""}
      />
      <text x="30" y="28" fill={activeComponent === "vpc" ? "hsl(142 71% 45%)" : "hsl(210 100% 56%)"} fontSize="9" fontFamily="monospace">VPC — 10.0.0.0/16</text>

      {/* Subnet A */}
      <rect
        x="30" y="40" width="105" height="90" rx="4"
        fill={activeComponent === "subnet" ? "hsl(142 71% 45% / 0.05)" : "hsl(220 18% 10%)"}
        stroke={highlight("subnet").stroke ?? "hsl(142 71% 45% / 0.4)"}
        strokeWidth={activeComponent === "subnet" ? 2 : 1}
      />
      <text x="40" y="55" fill="hsl(142 71% 45%)" fontSize="8" fontFamily="monospace">Subnet A</text>
      <text x="40" y="66" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">10.0.1.0/24 (public)</text>

      <rect
        x="45" y="78" width="75" height="22" rx="3"
        fill={activeComponent === "instance" ? "hsl(142 71% 45% / 0.1)" : "hsl(220 14% 14%)"}
        stroke={highlight("instance").stroke ?? "hsl(210 100% 56% / 0.3)"}
        strokeWidth={activeComponent === "instance" ? 2 : 1}
        className={activeComponent === "instance" && isRunning ? "animate-glow-pulse" : ""}
      />
      <text x="82" y="92" textAnchor="middle" fill={activeComponent === "instance" ? "hsl(142 71% 45%)" : "hsl(210 20% 90%)"} fontSize="7" fontFamily="monospace">web-server-1</text>

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
      <rect
        x="60" y="200" width="160" height="55" rx="4"
        fill={activeComponent === "sg" ? "hsl(0 72% 51% / 0.1)" : "hsl(220 18% 10%)"}
        stroke={highlight("sg").stroke ?? "hsl(0 72% 51% / 0.3)"}
        strokeWidth={activeComponent === "sg" ? 2 : 1}
      />
      <text x="70" y="215" fill="hsl(0 72% 51%)" fontSize="8" fontFamily="monospace">Security Group</text>
      <text x="70" y="228" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">→ Allow 80, 443 inbound</text>
      <text x="70" y="239" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">→ Allow 5432 from Subnet A</text>
      <text x="70" y="250" fill="hsl(215 12% 55%)" fontSize="6" fontFamily="monospace">→ Deny all other</text>

      <line x1="140" y1="185" x2="140" y2="200" stroke="hsl(210 100% 56% / 0.3)" strokeWidth="1" />

      {isComplete && (
        <text x="140" y="275" textAnchor="middle" fill="hsl(142 71% 45%)" fontSize="8" fontFamily="monospace">✓ All resources provisioned</text>
      )}
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
