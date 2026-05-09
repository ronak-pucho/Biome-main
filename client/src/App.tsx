import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SearchPage from "./pages/SearchPage";
import EcommercePage from "./pages/EcommercePage";
import FoodPage from "./pages/FoodPage";
import RidesPage from "./pages/RidesPage";
import TravelPage from "./pages/TravelPage";
import HospitalityPage from "./pages/HospitalityPage";
import DashboardPage from "./pages/DashboardPage";
import AuthPage from "./pages/AuthPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={SearchPage} />
      <Route path="/deals" component={Home} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/ecommerce" component={EcommercePage} />
      <Route path="/food" component={FoodPage} />
      <Route path="/rides" component={RidesPage} />
      <Route path="/travel" component={TravelPage} />
      <Route path="/hospitality" component={HospitalityPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
