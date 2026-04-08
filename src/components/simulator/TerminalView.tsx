import { useEffect, useRef, useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import type { CommandStep } from "@/data/labs";

export function TerminalView() {
  const { activeLab, simState, currentStep, setCurrentStep, completeSim } = useWorkspace();
  const [lines, setLines] = useState<{ text: string; type: "command" | "output" | "prompt" | "error" }[]>([]);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  const steps = (activeLab?.steps ?? []) as CommandStep[];

  useEffect(() => {
    setLines([{ text: "Router>", type: "prompt" }]);
    setTypingText("");
    setIsTyping(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [activeLab?.id]);

  useEffect(() => {
    if (simState !== "running" || currentStep >= steps.length) return;
    
    const step = steps[currentStep];
    if (!step) return;

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
          // Remove last prompt line
          if (newLines.length > 0 && newLines[newLines.length - 1].type === "prompt") {
            newLines.pop();
          }
          newLines.push({ text: step.command, type: "command" });
          step.output.forEach((o) => {
            const isErr = o.includes("%") && (o.includes("DOWN") || o.includes("ERR"));
            newLines.push({ text: o, type: isErr ? "error" : "output" });
          });
          // Add new prompt
          const lastOutput = step.output[step.output.length - 1] || "";
          if (lastOutput.endsWith("#") || lastOutput.endsWith(">")) {
            // prompt is in output already
          } else {
            newLines.push({ text: "", type: "prompt" });
          }
          return newLines;
        });
        setTypingText("");

        const nextStep = currentStep + 1;
        if (nextStep < steps.length) {
          setTimeout(() => {
            setCurrentStep(nextStep);
          }, 600);
        } else {
          completeSim();
        }
      }
    }, 40);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [simState, currentStep, steps, setCurrentStep, completeSim]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, typingText]);

  const getColor = (type: string) => {
    switch (type) {
      case "command": return "text-terminal-cyan";
      case "error": return "text-terminal-red";
      case "prompt": return "text-terminal-green";
      default: return "text-foreground";
    }
  };

  return (
    <div className="h-full bg-terminal-bg rounded font-mono-terminal text-xs p-3 overflow-y-auto">
      {lines.map((line, i) => (
        <div key={i} className={getColor(line.type)}>
          {line.type === "prompt" && !line.text ? null : line.text}
        </div>
      ))}
      {isTyping && (
        <div className="text-terminal-cyan">
          <span className="text-terminal-green">Router1# </span>
          {typingText}
          <span className="animate-blink">█</span>
        </div>
      )}
      {!isTyping && simState !== "complete" && (
        <div className="text-terminal-green">
          Router1# <span className="animate-blink">█</span>
        </div>
      )}
      {simState === "complete" && (
        <div className="text-terminal-green mt-2">
          ✓ Lab simulation complete
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
