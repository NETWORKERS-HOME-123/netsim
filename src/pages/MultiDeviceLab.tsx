import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { multiDeviceLabs } from "@/data/labs-multidevice";
import type { MultiDeviceLab, MultiDeviceStep } from "@/data/labs-multidevice";
import { ChevronRight, Play, RotateCcw, CheckCircle, XCircle, ArrowLeft, Monitor, Server } from "lucide-react";
import { Button } from "@/components/ui/button";

type SimState = "idle" | "running" | "verifying" | "complete";

function TopologySVG({ lab, activeDevice }: { lab: MultiDeviceLab; activeDevice: string | null }) {
  const { nodes, links } = lab.topology;

  const getNodePos = (id: string) => {
    const n = nodes.find((n) => n.id === id);
    return n ? { x: n.x, y: n.y } : { x: 0, y: 0 };
  };

  return (
    <svg viewBox="0 0 620 420" className="w-full h-full">
      <defs>
        <filter id="glow-active">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Links */}
      {links.map((link, i) => {
        const from = getNodePos(link.from);
        const to = getNodePos(link.to);
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        const isActive = activeDevice === link.from || activeDevice === link.to;
        return (
          <g key={i}>
            <line
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={isActive ? "hsl(142,71%,45%)" : "hsl(220,14%,28%)"}
              strokeWidth={isActive ? 2.5 : 1.5}
              strokeDasharray={isActive ? "8,4" : "none"}
              opacity={isActive ? 1 : 0.7}
            />
            <rect x={midX - 46} y={midY - 9} width={92} height={18} rx={3} fill="hsl(220,20%,7%)" fillOpacity={0.92} stroke="hsl(220,14%,20%)" strokeWidth={0.5} />
            <text x={midX} y={midY + 4} textAnchor="middle" fontSize={9} fill="hsl(215,12%,60%)">
              {link.network.length > 18 ? link.network.slice(0, 17) + "…" : link.network}
            </text>
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const isActive = activeDevice === node.id;
        const isRouter = node.type === "router";
        const isPC = node.type === "pc";
        const fillColor = isActive
          ? "hsl(142,71%,45%)"
          : isRouter ? "hsl(210,100%,56%)" : isPC ? "hsl(38,92%,50%)" : "hsl(187,85%,53%)";

        return (
          <g key={node.id} filter={isActive ? "url(#glow-active)" : undefined}>
            {/* Device shape */}
            {isRouter ? (
              <circle cx={node.x} cy={node.y} r={28} fill="hsl(220,18%,10%)" stroke={fillColor} strokeWidth={isActive ? 3 : 2} />
            ) : isPC ? (
              <rect x={node.x - 20} y={node.y - 17} width={40} height={34} rx={5} fill="hsl(220,18%,10%)" stroke={fillColor} strokeWidth={isActive ? 3 : 2} />
            ) : (
              <rect x={node.x - 28} y={node.y - 17} width={56} height={34} rx={5} fill="hsl(220,18%,10%)" stroke={fillColor} strokeWidth={isActive ? 3 : 2} />
            )}

            {/* Icon */}
            {isRouter && (
              <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize={18} fill={fillColor}>⬡</text>
            )}
            {node.type === "switch" && (
              <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize={16} fill={fillColor}>⊞</text>
            )}
            {isPC && (
              <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize={16} fill={fillColor}>▣</text>
            )}

            {/* Label */}
            <text x={node.x} y={node.y - (isRouter ? 34 : 26)} textAnchor="middle" fontSize={11} fontWeight="bold" fill={isActive ? "hsl(142,71%,45%)" : "hsl(210,20%,90%)"}>
              {node.label}
            </text>

            {/* IP addresses */}
            {node.interfaces.filter(i => i.ip !== "N/A").slice(0, 3).map((intf, idx) => (
              <text key={idx} x={node.x} y={node.y + (isRouter ? 40 : 30) + idx * 13} textAnchor="middle" fontSize={9} fill="hsl(38,92%,50%)">
                {intf.name}: {intf.ip}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function MultiDeviceTerminal({
  lines,
  typingText,
  isTyping,
  activeDevice,
  simState,
}: {
  lines: { text: string; type: "command" | "output" | "error" | "device-header" | "prompt" }[];
  typingText: string;
  isTyping: boolean;
  activeDevice: string | null;
  simState: SimState;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, typingText]);

  const getColor = (type: string) => {
    switch (type) {
      case "command": return "text-terminal-cyan";
      case "error": return "text-terminal-red";
      case "prompt": return "text-terminal-green";
      case "device-header": return "text-terminal-amber font-bold";
      default: return "text-foreground";
    }
  };

  return (
    <div className="h-full bg-[hsl(var(--terminal-bg))] rounded font-mono-terminal text-xs p-3 overflow-y-auto">
      {lines.map((line, i) => (
        <div key={i} className={getColor(line.type)}>
          {line.text}
        </div>
      ))}
      {isTyping && activeDevice && (
        <div className="text-terminal-cyan">
          <span className="text-terminal-green">{activeDevice}# </span>
          {typingText}
          <span className="animate-blink">█</span>
        </div>
      )}
      {!isTyping && simState !== "complete" && simState !== "verifying" && activeDevice && (
        <div className="text-terminal-green">
          {activeDevice}# <span className="animate-blink">█</span>
        </div>
      )}
      {simState === "complete" && (
        <div className="text-terminal-green mt-2 font-bold">
          ✓ Multi-device lab simulation complete — all verifications passed
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

export default function MultiDeviceLabPage() {
  const [selectedLab, setSelectedLab] = useState<MultiDeviceLab>(multiDeviceLabs[0]);
  const [simState, setSimState] = useState<SimState>("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [verifyStep, setVerifyStep] = useState(0);
  const [lines, setLines] = useState<{ text: string; type: "command" | "output" | "error" | "device-header" | "prompt" }[]>([]);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeDevice, setActiveDevice] = useState<string | null>(null);
  const [lastDevice, setLastDevice] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Reset on lab change
  useEffect(() => {
    setSimState("idle");
    setCurrentStep(0);
    setVerifyStep(0);
    setLines([{ text: "Select a lab and press Start to begin multi-device simulation...", type: "output" }]);
    setTypingText("");
    setIsTyping(false);
    setActiveDevice(null);
    setLastDevice(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [selectedLab.id]);

  const runStep = useCallback((stepIdx: number) => {
    const step = selectedLab.steps[stepIdx];
    if (!step) return;

    // Device header when switching devices
    if (step.device !== lastDevice) {
      setLines((prev) => [
        ...prev,
        { text: "", type: "output" },
        { text: `═══════════ ${step.device} ═══════════`, type: "device-header" },
      ]);
      setLastDevice(step.device);
    }
    setActiveDevice(step.device);

    // Type the command
    setIsTyping(true);
    let charIdx = 0;
    setTypingText("");

    intervalRef.current = window.setInterval(() => {
      if (charIdx < step.command.length) {
        setTypingText(step.command.slice(0, charIdx + 1));
        charIdx++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsTyping(false);

        setLines((prev) => {
          const newLines = [...prev];
          newLines.push({ text: `${step.device}# ${step.command}`, type: "command" });
          step.output.forEach((o) => {
            const isErr = o.includes("%") && (o.includes("DOWN") || o.includes("ERR"));
            newLines.push({ text: o, type: isErr ? "error" : "output" });
          });
          if (step.explanation) {
            newLines.push({ text: `  💡 ${step.explanation}`, type: "prompt" });
          }
          return newLines;
        });
        setTypingText("");

        const nextStep = stepIdx + 1;
        if (nextStep < selectedLab.steps.length) {
          setTimeout(() => {
            setCurrentStep(nextStep);
          }, 350);
        } else {
          // Move to verification phase
          setTimeout(() => {
            setSimState("verifying");
            setVerifyStep(0);
          }, 600);
        }
      }
    }, 30);
  }, [selectedLab, lastDevice]);

  // Run config steps
  useEffect(() => {
    if (simState !== "running") return;
    runStep(currentStep);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [simState, currentStep, runStep]);

  // Run verification steps
  useEffect(() => {
    if (simState !== "verifying") return;
    if (verifyStep >= selectedLab.verifications.length) {
      setSimState("complete");
      return;
    }

    const v = selectedLab.verifications[verifyStep];
    setActiveDevice(v.device);

    const timer = setTimeout(() => {
      setLines((prev) => [
        ...prev,
        { text: "", type: "output" },
        { text: `══ VERIFY: ${v.checkLabel} ══`, type: "device-header" },
        { text: `${v.device}# ${v.command}`, type: "command" },
        ...v.output.map((o) => ({ text: o, type: "output" as const })),
        { text: `  ✓ ${v.checkLabel}`, type: "prompt" },
      ]);
      setVerifyStep((p) => p + 1);
    }, 800);

    return () => clearTimeout(timer);
  }, [simState, verifyStep, selectedLab]);

  const handleStart = () => {
    setSimState("running");
    setCurrentStep(0);
    setVerifyStep(0);
    setLastDevice(null);
    setLines([{ text: "▶ Starting multi-device lab simulation...", type: "prompt" }]);
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSimState("idle");
    setCurrentStep(0);
    setVerifyStep(0);
    setLines([{ text: "Select a lab and press Start to begin multi-device simulation...", type: "output" }]);
    setTypingText("");
    setIsTyping(false);
    setActiveDevice(null);
    setLastDevice(null);
  };

  const totalSteps = selectedLab.steps.length + selectedLab.verifications.length;
  const completedSteps = simState === "complete"
    ? totalSteps
    : simState === "verifying"
      ? selectedLab.steps.length + verifyStep
      : currentStep;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <div className="h-14 border-b border-border bg-card flex items-center px-4 gap-4 shrink-0">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-mono-terminal">SIMULATOR</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs font-mono-terminal text-foreground">Multi-Device Labs</span>
        <ChevronRight className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs font-mono-terminal text-primary">{selectedLab.name}</span>

        <div className="flex-1" />

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-mono-terminal text-muted-foreground">
            Step {completedSteps}/{totalSteps}
          </div>
          <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-terminal-green rounded-full transition-all duration-300"
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            />
          </div>
          <span className={`text-[10px] font-mono-terminal px-2 py-0.5 rounded ${
            selectedLab.difficulty === "CCNP" ? "bg-terminal-amber/20 text-terminal-amber" : "bg-terminal-green/20 text-terminal-green"
          }`}>
            {selectedLab.difficulty}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 border-l border-border pl-4">
          {simState === "idle" && (
            <Button size="sm" onClick={handleStart} className="h-7 text-xs font-mono-terminal bg-terminal-green/20 hover:bg-terminal-green/30 text-terminal-green border border-terminal-green/30">
              <Play className="w-3 h-3 mr-1" /> Start
            </Button>
          )}
          {(simState === "running" || simState === "verifying" || simState === "complete") && (
            <Button size="sm" onClick={handleReset} variant="outline" className="h-7 text-xs font-mono-terminal">
              <RotateCcw className="w-3 h-3 mr-1" /> Reset
            </Button>
          )}
        </div>

        {/* Devices count */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground border-l border-border pl-4">
          <Monitor className="w-3 h-3" />
          <span className="font-mono-terminal">{selectedLab.topology.nodes.length} devices</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Lab sidebar */}
        <div className="w-56 border-r border-border bg-[hsl(var(--sidebar-background))] overflow-y-auto shrink-0">
          <div className="p-3 border-b border-border">
            <h3 className="text-[10px] font-mono-terminal text-muted-foreground uppercase tracking-wider">Scenarios</h3>
          </div>
          {multiDeviceLabs.map((lab) => (
            <button
              key={lab.id}
              onClick={() => setSelectedLab(lab)}
              className={`w-full text-left px-3 py-3 border-b border-border/50 transition-colors ${
                selectedLab.id === lab.id
                  ? "bg-primary/10 border-l-2 border-l-primary"
                  : "hover:bg-accent"
              }`}
            >
              <div className="text-xs font-mono-terminal text-foreground">{lab.name}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{lab.category} • {lab.topology.nodes.length} devices</div>
            </button>
          ))}
        </div>

        {/* Center: Terminal + Objective */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Objective bar */}
          <div className="p-3 border-b border-border bg-card/50">
            <div className="text-[10px] font-mono-terminal text-terminal-amber uppercase tracking-wider mb-1">Objective</div>
            <div className="text-xs text-foreground leading-relaxed">{selectedLab.objective}</div>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Terminal */}
            <div className="flex-1 min-w-0 p-2">
              <MultiDeviceTerminal
                lines={lines}
                typingText={typingText}
                isTyping={isTyping}
                activeDevice={activeDevice}
                simState={simState}
              />
            </div>

            {/* Right: Topology + Device Table */}
            <div className="w-[340px] border-l border-border flex flex-col shrink-0">
              {/* Topology */}
              <div className="flex-1 p-2 border-b border-border overflow-hidden">
                <div className="text-[10px] font-mono-terminal text-muted-foreground uppercase tracking-wider mb-1 px-1">
                  Network Topology
                </div>
                <TopologySVG lab={selectedLab} activeDevice={activeDevice} />
              </div>

              {/* Device table */}
              <div className="h-48 overflow-y-auto p-2">
                <div className="text-[10px] font-mono-terminal text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Device Interfaces
                </div>
                <table className="w-full text-[10px] font-mono-terminal">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left py-1 px-1">Device</th>
                      <th className="text-left py-1 px-1">Interface</th>
                      <th className="text-left py-1 px-1">IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLab.topology.nodes.flatMap((node) =>
                      node.interfaces.filter(i => i.ip !== "N/A").map((intf, idx) => (
                        <tr
                          key={`${node.id}-${idx}`}
                          className={`border-b border-border/30 ${activeDevice === node.id ? "text-terminal-green" : "text-foreground"}`}
                        >
                          <td className="py-0.5 px-1">{idx === 0 ? node.id : ""}</td>
                          <td className="py-0.5 px-1 text-terminal-cyan">{intf.name}</td>
                          <td className="py-0.5 px-1 text-terminal-amber">{intf.ip}/{intf.mask === "255.255.255.255" ? "32" : intf.mask === "255.255.255.252" ? "30" : intf.mask === "255.255.255.0" ? "24" : intf.mask}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom: Verifications */}
          <div className="h-36 border-t border-border bg-card shrink-0 overflow-y-auto p-3">
            <div className="text-[10px] font-mono-terminal text-muted-foreground uppercase tracking-wider mb-2">
              Verification Checks ({simState === "complete" ? selectedLab.verifications.length : verifyStep}/{selectedLab.verifications.length})
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {selectedLab.verifications.map((v, i) => {
                const done = simState === "complete" || (simState === "verifying" && i < verifyStep);
                const running = simState === "verifying" && i === verifyStep;
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {done ? (
                      <CheckCircle className="w-3.5 h-3.5 text-terminal-green shrink-0" />
                    ) : running ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-terminal-amber border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />
                    )}
                    <span className={`${done ? "text-terminal-green" : running ? "text-terminal-amber" : "text-muted-foreground"} truncate`}>
                      [{v.device}] {v.checkLabel}
                    </span>
                  </div>
                );
              })}
            </div>
            {simState === "complete" && (
              <div className="mt-3 p-2 bg-terminal-green/10 border border-terminal-green/20 rounded text-xs text-foreground">
                <span className="text-terminal-green font-bold">Lab Complete:</span> {selectedLab.explanation}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
