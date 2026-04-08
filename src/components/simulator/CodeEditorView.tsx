import { useEffect, useState, useRef } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import type { CodeStep } from "@/data/labs";

export function CodeEditorView() {
  const { activeLab, simState, currentStep, completeSim } = useWorkspace();
  const [displayedCode, setDisplayedCode] = useState("");
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const intervalRef = useRef<number | null>(null);

  const steps = (activeLab?.steps ?? []) as CodeStep[];
  const fullCode = steps[0]?.code ?? "";
  const fullOutput = steps[0]?.output ?? [];

  useEffect(() => {
    setDisplayedCode("");
    setOutputLines([]);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [activeLab?.id]);

  useEffect(() => {
    if (simState !== "running") return;
    let charIdx = 0;
    setDisplayedCode("");
    setOutputLines([]);

    intervalRef.current = window.setInterval(() => {
      if (charIdx < fullCode.length) {
        setDisplayedCode(fullCode.slice(0, charIdx + 1));
        charIdx++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        // Stream output
        let outIdx = 0;
        const outInterval = window.setInterval(() => {
          if (outIdx < fullOutput.length) {
            setOutputLines((p) => [...p, fullOutput[outIdx]]);
            outIdx++;
          } else {
            clearInterval(outInterval);
            completeSim();
          }
        }, 150);
      }
    }, 15);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [simState, fullCode, fullOutput, completeSim]);

  const codeLines = (displayedCode || fullCode).split("\n");

  return (
    <div className="h-full flex flex-col">
      {/* Editor */}
      <div className="flex-1 bg-terminal-bg rounded-t font-mono-terminal text-xs overflow-y-auto">
        <div className="flex">
          {/* Line numbers */}
          <div className="py-3 px-2 text-right select-none border-r border-border min-w-[40px]">
            {codeLines.map((_, i) => (
              <div key={i} className="text-muted-foreground leading-5">{i + 1}</div>
            ))}
          </div>
          {/* Code */}
          <div className="py-3 px-3 flex-1">
            {codeLines.map((line, i) => (
              <div key={i} className="leading-5">
                <PythonLine line={line} />
              </div>
            ))}
            {simState === "running" && <span className="animate-blink text-terminal-green">█</span>}
          </div>
        </div>
      </div>
      {/* Terminal Output */}
      <div className="h-[40%] bg-terminal-bg border-t border-border rounded-b font-mono-terminal text-xs p-3 overflow-y-auto">
        <div className="text-muted-foreground mb-1">─── Output ───</div>
        {outputLines.map((line, i) => (
          <div key={i} className="text-foreground leading-5">{line}</div>
        ))}
        {simState === "running" && outputLines.length === 0 && (
          <div className="text-muted-foreground">Waiting for execution...</div>
        )}
      </div>
    </div>
  );
}

function PythonLine({ line }: { line: string }) {
  // Simple syntax highlighting
  const keywords = ["from", "import", "def", "class", "if", "else", "elif", "for", "while", "return", "print", "with", "as", "try", "except"];
  const parts: React.ReactNode[] = [];

  if (line.trimStart().startsWith("#")) {
    return <span className="text-muted-foreground">{line}</span>;
  }

  let remaining = line;
  let key = 0;

  // Highlight strings
  const stringRegex = /(["'])(?:(?!\1).)*\1|f(["'])(?:(?!\2).)*\2/g;
  const pieces = remaining.split(stringRegex);

  // Simple approach: tokenize by spaces
  const tokens = line.split(/(\s+|[(){}[\],.:=*])/);
  return (
    <span>
      {tokens.map((token, i) => {
        if (keywords.includes(token)) {
          return <span key={i} className="text-primary">{token}</span>;
        }
        if (token.startsWith('"') || token.startsWith("'")) {
          return <span key={i} className="text-terminal-green">{token}</span>;
        }
        if (/^\d+$/.test(token)) {
          return <span key={i} className="text-terminal-amber">{token}</span>;
        }
        return <span key={i}>{token}</span>;
      })}
    </span>
  );
}
