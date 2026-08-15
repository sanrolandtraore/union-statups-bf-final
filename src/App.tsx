import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Resources = lazy(() => import("./pages/Resources"));
const Syndicates = lazy(() => import("./pages/Syndicates"));
const CreateSyndicate = lazy(() => import("./pages/CreateSyndicate"));
const SyndicateDetail = lazy(() => import("./pages/SyndicateDetail"));
const DealDetail = lazy(() => import("./pages/DealDetail"));
const DealRedirect = lazy(() => import("./pages/DealRedirect"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PitchRooms = lazy(() => import("./pages/PitchRooms"));
const PitchRoomLive = lazy(() => import("./pages/PitchRoomLive"));
const PitchRoomReplay = lazy(() => import("./pages/PitchRoomReplay"));
const Jobs = lazy(() => import("./pages/Jobs"));
const JobDetail = lazy(() => import("./pages/JobDetail"));
const Gallery = lazy(() => import("./pages/Gallery"));
const TalentDirectory = lazy(() => import("./pages/TalentDirectory"));
const ProjectDirectory = lazy(() => import("./pages/ProjectDirectory"));
const StartupSchool = lazy(() => import("./pages/StartupSchool"));

import { PageSkeleton } from "@/components/ui/loading-skeletons";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoader = () => <PageSkeleton />;

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/index" element={<Navigate to="/" replace />} />
                <Route path="/index.html" element={<Navigate to="/" replace />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/legal/:slug" element={<LegalPage />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/ressources" element={<Resources />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/talents" element={<TalentDirectory />} />
                <Route path="/projets" element={<ProjectDirectory />} />
                <Route path="/startup-school" element={<StartupSchool />} />
                <Route path="/syndicates" element={<ProtectedRoute><Syndicates /></ProtectedRoute>} />
                <Route path="/syndicates/create" element={<ProtectedRoute><CreateSyndicate /></ProtectedRoute>} />
                <Route path="/syndicates/:id" element={<ProtectedRoute><SyndicateDetail /></ProtectedRoute>} />
                <Route path="/syndicates/:id/deals/:dealId" element={<ProtectedRoute><DealDetail /></ProtectedRoute>} />
                <Route path="/deals/:dealId" element={<ProtectedRoute><DealRedirect /></ProtectedRoute>} />
                <Route path="/pitch-rooms" element={<ProtectedRoute><PitchRooms /></ProtectedRoute>} />
                <Route path="/pitch-rooms/:id" element={<ProtectedRoute><PitchRoomLive /></ProtectedRoute>} />
                <Route path="/pitch-rooms/:id/replay" element={<ProtectedRoute><PitchRoomReplay /></ProtectedRoute>} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
