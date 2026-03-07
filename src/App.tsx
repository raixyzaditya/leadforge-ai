import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignsListPage";
import Prospects from "./pages/Prospects";
import Analytics from "./pages/Analytics";
import EmailAccounts from "./pages/EmailAccounts";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import ICP from "./pages/ICP";
import OnboardingPlan from "./pages/OnboradingPlan";
import OnBoardingDash from "./pages/OnBoardingDash";
import ProfilePage from "./pages/MyCreds";
import ProductPage from "./pages/Products";
import CampaignPage from "./pages/Campaigns";
import CampaignsListPage from "./pages/CampaignsListPage";
import UploadProcessing from "./pages/UploadProcessing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/plans" element={<OnboardingPlan/>}/>
          <Route path="/onboarding" element={<Onboarding/>}/>
          <Route path="/ondashboard" element={<OnBoardingDash/>}/>
          <Route path="/icp" element={<ICP/>}/>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/campaigns" element={<CampaignsListPage/>} />
          <Route path="/campaigns/:id" element={<CampaignPage />} />
          <Route path="/prospects" element={<Prospects />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/email-accounts" element={<EmailAccounts />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage/>}/>
          <Route path="*" element={<NotFound />} />
          <Route path="/products" element={<ProductPage/>}/>
          <Route path="/upload_processing/:jobId/:campId" element={<UploadProcessing/>}/> 
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
