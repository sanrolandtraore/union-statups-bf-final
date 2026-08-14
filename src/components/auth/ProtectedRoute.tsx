import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuardSkeleton } from "@/components/ui/loading-skeletons";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) return <AuthGuardSkeleton />;
  if (!session) return <Navigate to="/auth" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;

