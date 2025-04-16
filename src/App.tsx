import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

// Pages
import Index from "./pages/Index";
import GrammarPage from "./pages/GrammarPage";
import PronunciationPage from "./pages/PronunciationPage";
import RoleplayPage from "./pages/RoleplayPage";
import AvatarPage from "./pages/AvatarPage";
import DashboardPage from "./pages/DashboardPage";
import NotFound from "./pages/NotFound";

// Create a mock API service for simulation
import { initMockApi } from "./services/mockApi";

const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize our mock API service
    initMockApi();
    
    // Simulate app initialization
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-varna-purple to-varna-teal rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-background rounded-full"></div>
            <div className="absolute inset-5 bg-gradient-to-r from-varna-purple to-varna-teal rounded-full animate-pulse-glow"></div>
          </div>
          <p className="text-lg font-medium">Loading Varnanetra...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/grammar" element={<GrammarPage />} />
            <Route path="/pronunciation" element={<PronunciationPage />} />
            <Route path="/roleplay" element={<RoleplayPage />} />
            <Route path="/avatar" element={<AvatarPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
