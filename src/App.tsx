import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import MultiDeviceLabPage from "./pages/MultiDeviceLab.tsx";
import AutomationLabPage from "./pages/AutomationLab.tsx";
import AICodingLabPage from "./pages/AICodingLab.tsx";
import NetOpsLabPage from "./pages/NetOpsLab.tsx";
import SecurityLabPage from "./pages/SecurityLab.tsx";
import PythonSecOpsLabPage from "./pages/PythonSecOpsLab.tsx";
import CloudLabPage from "./pages/CloudLab.tsx";
import ForensicsLabPage from "./pages/ForensicsLab.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/multi-device" element={<MultiDeviceLabPage />} />
          <Route path="/automation" element={<AutomationLabPage />} />
          <Route path="/ai-coding" element={<AICodingLabPage />} />
          <Route path="/netops" element={<NetOpsLabPage />} />
          <Route path="/security" element={<SecurityLabPage />} />
          <Route path="/python-secops" element={<PythonSecOpsLabPage />} />
          <Route path="/cloud" element={<CloudLabPage />} />
          <Route path="/forensics" element={<ForensicsLabPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
