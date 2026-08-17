import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuardSkeleton } from "@/components/ui/loading-skeletons";

const ProtectedRoute = ({
  children,
  allowedRoles,
  redirectTo = "/dashboard",
}: {
  children: React.ReactNode;
  /** Si fourni, restreint l'accès à ces rôles (le rôle "admin" y a toujours accès). */
  allowedRoles?: string[];
  redirectTo?: string;
}) => {
  const { session, loading, role } = useAuth();

  if (loading) return <AuthGuardSkeleton />;
  if (!session) return <Navigate to="/auth" replace />;
  if (allowedRoles && role !== "admin" && (!role || !allowedRoles.includes(role))) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

