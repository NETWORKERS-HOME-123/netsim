import { useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, ChevronDown, ChevronRight } from "lucide-react";

export function BottomPanel() {
  const { activeLab, simState } = useWorkspace();
  const [revealedHints, setRevealedHints] = useState(0);

  if (!activeLab) return null;

  return (
    <div className="h-[220px] border-t border-border bg-card shrink-0">
      <Tabs defaultValue="logs" className="h-full flex flex-col">
        <TabsList className="bg-secondary rounded-none border-b border-border h-8 w-full justify-start px-2 gap-0">
          <TabsTrigger value="logs" className="text-[10px] font-mono-terminal h-7 rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary px-4">
            Logs
          </TabsTrigger>
          <TabsTrigger value="explanation" className="text-[10px] font-mono-terminal h-7 rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary px-4">
            Explanation
          </TabsTrigger>
          <TabsTrigger value="validation" className="text-[10px] font-mono-terminal h-7 rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary px-4">
            Validation
          </TabsTrigger>
          <TabsTrigger value="hints" className="text-[10px] font-mono-terminal h-7 rounded-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary px-4">
            Hints
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="flex-1 overflow-y-auto p-3 m-0 font-mono-terminal text-xs">
          {activeLab.logs.map((log, i) => {
            const isInfo = log.includes("[INFO]");
            const isConfig = log.includes("[CONFIG]");
            const isVerify = log.includes("[VERIFY]");
            const isDiag = log.includes("[DIAG]");
            const isIssue = log.includes("[ISSUE]");
            const isFix = log.includes("[FIX]");
            const isResolved = log.includes("[RESOLVED]");
            const isExec = log.includes("[EXEC]");
            const isOspf = log.includes("[OSPF]");
            const isTest = log.includes("[TEST]");
            const isNetmiko = log.includes("[NETMIKO]");
            const isStatus = log.includes("[STATUS]");

            let color = "text-muted-foreground";
            if (isConfig || isFix) color = "text-terminal-amber";
            if (isVerify || isResolved || isTest) color = "text-terminal-green";
            if (isIssue) color = "text-terminal-red";
            if (isExec || isOspf || isNetmiko) color = "text-terminal-cyan";
            if (isStatus) color = "text-primary";

            const showLine = simState === "complete" || simState === "running" || i < 2;

            return showLine ? (
              <div key={i} className={`${color} leading-5`}>
                {log}
              </div>
            ) : null;
          })}
          {simState === "idle" && (
            <div className="text-muted-foreground">Press Start to begin simulation...</div>
          )}
        </TabsContent>

        <TabsContent value="explanation" className="flex-1 overflow-y-auto p-3 m-0">
          <div className="text-xs text-foreground leading-relaxed">
            {activeLab.explanation}
          </div>
        </TabsContent>

        <TabsContent value="validation" className="flex-1 overflow-y-auto p-3 m-0">
          <div className="space-y-2">
            {activeLab.validations.map((v, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {simState === "complete" ? (
                  v.pass ? (
                    <CheckCircle className="w-4 h-4 text-terminal-green" />
                  ) : (
                    <XCircle className="w-4 h-4 text-terminal-red" />
                  )
                ) : (
                  <div className="w-4 h-4 rounded-full border border-border" />
                )}
                <span className={simState === "complete" ? (v.pass ? "text-terminal-green" : "text-terminal-red") : "text-muted-foreground"}>
                  {v.label}
                </span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="hints" className="flex-1 overflow-y-auto p-3 m-0">
          <div className="space-y-2">
            {activeLab.hints.map((hint, i) => (
              <div key={i}>
                {i < revealedHints ? (
                  <div className="flex items-start gap-2 text-xs">
                    <ChevronDown className="w-3 h-3 text-terminal-amber mt-0.5 shrink-0" />
                    <span className="text-foreground">{hint}</span>
                  </div>
                ) : i === revealedHints ? (
                  <button
                    onClick={() => setRevealedHints((p) => p + 1)}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-terminal-amber transition-colors"
                  >
                    <ChevronRight className="w-3 h-3 shrink-0" />
                    <span>Click to reveal hint {i + 1}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/30">
                    <ChevronRight className="w-3 h-3 shrink-0" />
                    <span>Hint {i + 1} (reveal previous first)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
