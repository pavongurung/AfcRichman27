import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import PlayerDetail from "@/pages/player-detail";
import Squad from "@/pages/squad";
import Statistics from "@/pages/statistics";
import AdminPlayer from "@/pages/admin-player";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/player/:id" component={PlayerDetail} />
          <Route path="/squad" component={Squad} />
          <Route path="/statistics" component={Statistics} />
          <Route path="/admin/player/:id" component={AdminPlayer} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
