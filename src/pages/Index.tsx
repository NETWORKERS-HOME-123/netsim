import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { Topbar } from "@/components/simulator/Topbar";
import { LabSidebar } from "@/components/simulator/LabSidebar";
import { CenterPanel } from "@/components/simulator/CenterPanel";
import { RightPanel } from "@/components/simulator/RightPanel";
import { BottomPanel } from "@/components/simulator/BottomPanel";

const Index = () => {
  return (
    <WorkspaceProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
        <Topbar />
        <div className="flex flex-1 min-h-0">
          <LabSidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex flex-1 min-h-0">
              <CenterPanel />
              <RightPanel />
            </div>
            <BottomPanel />
          </div>
        </div>
      </div>
    </WorkspaceProvider>
  );
};

export default Index;
