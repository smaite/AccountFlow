import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AiDocuments from "@/pages/ai-documents";
import ImageAnalysis from "@/pages/image-analysis";
import Sales from "@/pages/sales";
import Purchases from "@/pages/purchases";
import Products from "@/pages/products";
import Categories from "@/pages/categories";
import Suppliers from "@/pages/suppliers";
import Inventory from "@/pages/inventory";
import Reports from "@/pages/reports";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import Support from "@/pages/support";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f0f0' }}>
      <div style={{ width: '250px', backgroundColor: '#1a1a1a', color: 'white', padding: '20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>AccountFlow</h1>
      <Sidebar />
      </div>
      <div className="md:pl-64 flex flex-col flex-1 overflow-hidden" style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/ai-documents" component={AiDocuments} />
          <Route path="/image-analysis" component={ImageAnalysis} />
          <Route path="/sales" component={Sales} />
          <Route path="/purchases" component={Purchases} />
          <Route path="/products" component={Products} />
          <Route path="/categories" component={Categories} />
          <Route path="/suppliers" component={Suppliers} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/reports" component={Reports} />
          <Route path="/profile" component={Profile} />
          <Route path="/settings" component={Settings} />
          <Route path="/support" component={Support} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div style={{ backgroundColor: '#f0f0f0', minHeight: '100vh', color: '#333' }}>
        <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
