import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';
import MarketingLayout from './layouts/MarketingLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import GoogleCallback from './pages/auth/GoogleCallback';
import Onboarding from './pages/onboarding/Onboarding';
import CampaignDetail from './pages/campaigns/CampaignDetail';
import PrivacyPolicy from './pages/privacy-policy';
import TermsOfService from './pages/terms-of-service';
import DataDeletion from './pages/data-deletion';
import About from './pages/marketing/About';
import BrandLayout from './layouts/BrandLayout';
import CreatorLayout from './layouts/CreatorLayout';
import AdminLayout from './layouts/AdminLayout';
import BrandCreateCampaign from './pages/brand/CreateCampaign';
import BrandCampaigns from './pages/brand/Campaigns';
import BrandOverview from './pages/brand/Overview';
import CampaignCheckout from './pages/brand/CampaignCheckout';
import BrandWallet from './pages/brand/Wallet';
import CreatorDashboard from './pages/creator/Dashboard';
import CreatorCampaign from './pages/creator/Campaign';
import CreatorCampaigns from './pages/creator/Campaigns';
import CreatorPayments from './pages/creator/Payments';
import CreatorInsights from './pages/creator/Insights';
import CreatorAnalytics from './pages/creator/Analytics';
import CreatorBrands from './pages/creator/Brands';
import CreatorProfile from './pages/creator/Profile';
import CreatorMediaKit from './pages/creator/MediaKit';
import CreatorSettings from './pages/creator/Settings';
import CreatorReelStudio from './pages/creator/ReelStudio';
import CreatorBulkReelUpload from './pages/creator/BulkReelUpload';
import HomeRedirect from './components/auth/HomeRedirect'; 
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/admin/Dashboard';
import AdminCreators from './pages/admin/Creators';
import AdminBrands from './pages/admin/Brands';
import AdminCreatorDetail from './pages/admin/CreatorDetail';
import AdminCreatorInsights from './pages/admin/CreatorInsights';
import AdminBrandDetail from './pages/admin/BrandDetail';
import AdminCompareProfiles from './pages/admin/CompareProfiles';


const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <BrowserRouter>
          <Routes>
            {/* Public marketing & legal pages */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/about" element={<MarketingLayout children={<About />} />} />
            <Route path="/privacy-policy" element={<MarketingLayout children={<PrivacyPolicy />} />} />
            <Route path="/terms-of-service" element={<MarketingLayout children={<TermsOfService />} />} />
            <Route path="/data-deletion" element={<MarketingLayout children={<DataDeletion />} />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<GoogleCallback />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Brand Routes */}
            <Route path="/brand" element={<BrandLayout children={<Navigate to="/brand/dashboard" replace />} />} />
            <Route path="/brand/dashboard" element={<BrandLayout children={<BrandOverview />} />} />
            <Route path="/brand/campaigns" element={<BrandLayout children={<BrandCampaigns />} />} />
            <Route path="/brand/campaigns/create" element={<BrandLayout children={<BrandCreateCampaign />} />} />
            <Route path="/brand/campaigns/create/checkout" element={<BrandLayout children={<CampaignCheckout />} />} />
            <Route path="/brand/campaigns/:id" element={<BrandLayout children={<CampaignDetail />} />} />
            <Route path="/brand/wallet" element={<BrandLayout children={<BrandWallet />} />} />
            <Route path="/brand/creators" element={<BrandLayout children={<div>Brand Creators</div>} />} />
            <Route path="/brand/analytics" element={<BrandLayout children={<div>Brand Analytics</div>} />} />

            {/* Creator Routes */}
            <Route path="/creator" element={<CreatorLayout children={<Navigate to="/creator/dashboard" replace />} />} />
            <Route path="/creator/dashboard" element={<CreatorLayout children={<CreatorDashboard />} />} />
            <Route path="/creator/reel-studio" element={<CreatorLayout children={<CreatorReelStudio />} />} />
            <Route path="/creator/bulk-reels" element={<CreatorLayout children={<CreatorBulkReelUpload />} />} />
            <Route path="/creator/analytics" element={<CreatorLayout children={<CreatorAnalytics />} />} />
            <Route path="/creator/insights/:id" element={<CreatorLayout children={<CreatorInsights />} />} />
            <Route path="/creator/campaigns/:id" element={<CreatorLayout children={<CreatorCampaign />} />} />
            <Route path="/creator/campaigns" element={<CreatorLayout children={<CreatorCampaigns />} />} />
            <Route path="/creator/brands" element={<CreatorLayout children={<CreatorBrands />} />} />
            <Route path="/creator/profile" element={<CreatorLayout children={<CreatorProfile />} />} />
            <Route path="/creator/media-kit" element={<CreatorLayout children={<CreatorMediaKit />} />} />
            <Route path="/creator/payments" element={<CreatorLayout children={<CreatorPayments />} />} />
            <Route path="/creator/settings" element={<CreatorLayout children={<CreatorSettings />} />} />
            <Route path="/creator/messages" element={<CreatorLayout children={<div>Creator Messages</div>} />} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminLayout children={<AdminDashboard />} />} />
            <Route path="/admin/creators" element={<AdminLayout children={<AdminCreators />} />} />
            <Route path="/admin/compare" element={<AdminLayout children={<AdminCompareProfiles />} />} />
            <Route path="/admin/creators/:id/insights" element={<AdminLayout children={<AdminCreatorInsights />} />} />
            <Route path="/admin/creators/:id" element={<AdminLayout children={<AdminCreatorDetail />} />} />
            <Route path="/admin/brands" element={<AdminLayout children={<AdminBrands />} />} />
            <Route path="/admin/brands/:id" element={<AdminLayout children={<AdminBrandDetail />} />} />
            <Route path="/admin/settings" element={<AdminLayout children={<div>Admin Settings</div>} />} />

            <Route path="*" element={<MarketingLayout children={<NotFound />} />} />
          </Routes>
        </BrowserRouter>
      </JotaiProvider>
    </QueryClientProvider>
  );
}

export default App;
