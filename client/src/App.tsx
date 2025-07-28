import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AiDocuments from "@/pages/ai-documents";
import Sales from "@/pages/sales";
import Purchases from "@/pages/purchases";
import Products from "@/pages/products";
import Suppliers from "@/pages/suppliers";
import Inventory from "@/pages/inventory";
import Reports from "@/pages/reports";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="md:pl-64 flex flex-col flex-1 overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/ai-documents" component={AiDocuments} />
          <Route path="/sales" component={Sales} />
          <Route path="/purchases" component={Purchases} />
          <Route path="/products" component={Products} />
          <Route path="/suppliers" component={Suppliers} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/reports" component={Reports} />
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
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
