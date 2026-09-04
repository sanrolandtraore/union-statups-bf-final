import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AtSign, KeyRound, UserCircle, ArrowLeft, Eye, EyeOff, MailCheck } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import logoIcon from "@/assets/brand/icon.png";

type AppRole = "talent" | "startup" | "investor" | "partner" | "mentor";

const getAuthRedirectUrl = () => `${window.location.origin}/auth/callback`;

/** Traduit les messages d'erreur Supabase (en anglais) en messages clairs en français. */
const translateAuthError = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes("user already registered") || m.includes("already registered")) {
    return "Un compte existe déjà avec cette adresse e-mail. Connectez-vous ou réinitialisez votre mot de passe.";
  }
  if (m.includes("invalid login credentials")) {
    return "E-mail ou mot de passe incorrect.";
  }
  if (m.includes("email not confirmed")) {
    return "Votre e-mail n'a pas encore été vérifié. Consultez votre boîte de réception.";
  }
  if (m.includes("password should be at least") || m.includes("password") && m.includes("character")) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }
  if (m.includes("invalid email") || m.includes("unable to validate email")) {
    return "Adresse e-mail invalide.";
  }
  if (m.includes("rate limit") || m.includes("too many requests")) {
    return "Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.";
  }
  if (m.includes("failed to fetch") || m.includes("networkerror") || m.includes("network request failed")) {
    return "Connexion au serveur impossible. Vérifiez votre connexion internet et réessayez.";
  }
  return message;
};

const Auth = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);

  const ROLES: { value: AppRole; label: string; description: string }[] = [
    { value: "talent", label: t("auth.roleTalent"), description: t("auth.roleTalentDesc") },
    { value: "startup", label: t("auth.roleStartup"), description: t("auth.roleStartupDesc") },
    { value: "investor", label: t("auth.roleInvestor"), description: t("auth.roleInvestorDesc") },
    { value: "partner", label: t("auth.rolePartner"), description: t("auth.rolePartnerDesc") },
    { value: "mentor", label: t("auth.roleMentor", "Mentor"), description: t("auth.roleMentorDesc", "Accompagner les fondateurs avec votre expertise") },
  ];

  useEffect(() => {
    if (session) navigate("/dashboard", { replace: true });
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      toast.error(translateAuthError(error.message));
      if (/email.*confirm|confirm.*email|not confirmed/i.test(error.message)) {
        setVerificationPending(true);
      }
      return;
    }
    toast.success(t("auth.loginSuccess"));
    navigate("/dashboard");
  };

  const resendVerification = async () => {
    if (!email) {
      toast.error("Saisissez votre adresse e-mail pour renvoyer la vérification.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: getAuthRedirectUrl() },
    });
    setLoading(false);
    if (error) {
      toast.error(translateAuthError(error.message));
      return;
    }
    toast.success("L'e-mail de vérification a été renvoyé.");
  };

  const [roleError, setRoleError] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Veuillez indiquer votre nom complet.");
      return;
    }
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (!selectedRole) {
      setRoleError(true);
      toast.error(t("auth.selectRole"));
      return;
    }
    setRoleError(false);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim(), role: selectedRole },
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });
    setLoading(false);
    if (error) {
      toast.error(translateAuthError(error.message));
      return;
    }

    if (data.session) {
      toast.success(t("auth.loginSuccess"));
      navigate("/dashboard");
      return;
    }

    setVerificationPending(true);
    toast.success("Compte créé. Vérifiez votre adresse e-mail avant de vous connecter.");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(translateAuthError(error.message));
    } else {
      toast.success(t("auth.resetSent"));
      setMode("login");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
      {/* Image de fond premium avec overlay sombre pour la lisibilité */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(https://images.unsplash.com/photo-1604328727766-a151d1045ab4?auto=format&fit=crop&w=2000&q=80)" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" aria-hidden="true" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <a href="/" className="inline-flex items-center gap-2">
            <img src={logoIcon} alt="Union'S" className="h-10 w-10 object-contain" />
            <span className="text-2xl font-display font-bold text-white">
              Union<span className="text-gradient-gold">'S</span>
            </span>
          </a>
          <LanguageSwitcher />
        </div>

        <div className="rounded-2xl border border-white/10 bg-card/95 backdrop-blur-xl p-8 shadow-2xl">
          {verificationPending ? (
            <div className="space-y-5 text-center">
              <MailCheck className="mx-auto h-12 w-12 text-primary" />
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Vérifiez votre e-mail</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Un lien de confirmation a été envoyé à <strong>{email}</strong>. Ouvrez-le pour activer votre compte.
                </p>
              </div>
              <Button className="w-full" onClick={() => void resendVerification()} disabled={loading}>
                {loading ? "Envoi…" : "Renvoyer l'e-mail de vérification"}
              </Button>
              <button type="button" className="text-sm text-primary hover:underline" onClick={() => { setVerificationPending(false); setMode("login"); }}>
                Retour à la connexion
              </button>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-center font-display text-2xl font-bold text-foreground">
                {mode === "login" && t("auth.login")}
                {mode === "signup" && t("auth.signup")}
                {mode === "forgot" && t("auth.forgot")}
              </h2>
              <p className="mb-6 text-center text-sm text-muted-foreground">
                {mode === "login" && t("auth.loginSubtitle")}
                {mode === "signup" && t("auth.signupSubtitle")}
                {mode === "forgot" && t("auth.forgotSubtitle")}
              </p>

              {mode === "login" && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <div className="relative"><AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="email" type="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required /></div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <div className="relative"><KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
                  </div>
                  <button type="button" className="text-sm text-primary hover:underline" onClick={() => setMode("forgot")}>{t("auth.forgotLink")}</button>
                  <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground font-semibold" disabled={loading}>{loading ? t("auth.loggingIn") : t("auth.loginBtn")}</Button>
                </form>
              )}

              {mode === "signup" && (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="fullName">{t("auth.fullName")}</Label><div className="relative"><UserCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="fullName" placeholder={t("auth.yourName")} value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10" required /></div></div>
                  <div className="space-y-2"><Label htmlFor="signupEmail">{t("auth.email")}</Label><div className="relative"><AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="signupEmail" type="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required /></div></div>
                  <div className="space-y-2"><Label htmlFor="signupPassword">{t("auth.password")}</Label><div className="relative"><KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="signupPassword" type={showPassword ? "text" : "password"} placeholder={t("auth.minChars")} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required minLength={6} /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
                  <div className="space-y-2"><Label>{t("auth.yourRole")}</Label><div className="grid grid-cols-2 gap-2">{ROLES.map((r) => <button key={r.value} type="button" onClick={() => { setSelectedRole(r.value); setRoleError(false); }} className={`rounded-lg border p-3 text-left transition-all ${selectedRole === r.value ? "border-primary bg-primary/10" : roleError ? "border-destructive" : "border-border hover:border-primary/50"}`}><div className="text-sm font-medium text-foreground">{r.label}</div><div className="text-xs text-muted-foreground">{r.description}</div></button>)}</div>{roleError && <p className="text-xs text-destructive">Veuillez sélectionner un rôle pour continuer.</p>}</div>
                  <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground font-semibold" disabled={loading}>{loading ? t("auth.signingUp") : t("auth.signupBtn")}</Button>
                </form>
              )}

              {mode === "forgot" && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="forgotEmail">{t("auth.email")}</Label><div className="relative"><AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="forgotEmail" type="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required /></div></div>
                  <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground font-semibold" disabled={loading}>{loading ? t("auth.sending") : t("auth.sendLink")}</Button>
                  <button type="button" className="flex w-full items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode("login")}><ArrowLeft className="h-4 w-4" /> {t("auth.backToLogin")}</button>
                </form>
              )}

              {mode !== "forgot" && <p className="mt-6 text-center text-sm text-muted-foreground">{mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}<button className="ml-1 text-primary hover:underline" onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? t("auth.signupBtn") : t("auth.loginBtn")}</button></p>}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
