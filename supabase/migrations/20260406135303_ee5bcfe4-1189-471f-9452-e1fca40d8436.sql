
-- 1. Remove the permissive INSERT policy on user_subscriptions
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.user_subscriptions;

-- 2. Remove the permissive UPDATE policy and replace with admin-only update
DROP POLICY IF EXISTS "Users can cancel own subscription" ON public.user_subscriptions;

-- Allow admins to manage all subscriptions
CREATE POLICY "Admin can manage subscriptions"
ON public.user_subscriptions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Remove the self-service INSERT policy on user_roles
DROP POLICY IF EXISTS "Users can insert their own non-admin role" ON public.user_roles;

-- Admin can manage all roles
CREATE POLICY "Admin can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
