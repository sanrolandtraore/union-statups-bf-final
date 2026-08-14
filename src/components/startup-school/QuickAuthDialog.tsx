import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AtSign, KeyRound, UserCircle, Eye, EyeOff, GraduationCap } from "lucide-react";

type AppRole = "talent" | "startup" | "investor" | "partner";

interface QuickAuthDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const QuickAuthDialog = ({ open, onClose, onSuccess }: QuickAuthDialogProps) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("startup");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const ROLES: { value: AppRole; label: string }[] = [
    { value: "talent", label: t("auth.roleTalent") },
    { value: "startup", label: t("auth.roleStartup") },
    { value: "investor", label: t("auth.roleInvestor") },
    { value: "partner", label: t("auth.rolePartner") },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success(t("auth.loginSuccess"));
      onSuccess?.();
      onClose();
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, role }, emailRedirectTo: window.location.origin + "/startup-school" },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success(t("auth.signupSuccess"));
      setMode("login");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center font-display text-xl">
            {mode === "signup" ? t("school.quickSignupTitle") : t("school.quickLoginTitle")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("school.quickAuthDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="qa-name">{t("auth.fullName")}</Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="qa-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("auth.yourRole")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button key={r.value} type="button" onClick={() => setRole(r.value)}
                      className={`rounded-lg border p-2 text-sm transition-all ${role === r.value ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="qa-email">{t("auth.email")}</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="qa-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qa-pwd">{t("auth.password")}</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="qa-pwd" type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required minLength={6} />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground font-semibold">
            {loading ? "…" : mode === "signup" ? t("school.quickSignupBtn") : t("school.quickLoginBtn")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "signup" ? t("auth.hasAccount") : t("auth.noAccount")}
          <button className="ml-1 text-primary hover:underline" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
            {mode === "signup" ? t("auth.loginBtn") : t("auth.signupBtn")}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAuthDialog;
