import { useState } from "react";
import { Lock, Unlock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

// Simple hash function for client-side (in production, use server-side hashing)
export const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

type SetPasswordDialogProps = {
  isProtected: boolean;
  onSetPassword: (password: string | null) => void;
};

export function SetPasswordDialog({
  isProtected,
  onSetPassword,
}: SetPasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const handleSubmit = () => {
    if (!password) {
      setError(t("password.errorEmpty"));
      return;
    }
    if (password.length < 4) {
      setError(t("password.errorShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("password.errorMismatch"));
      return;
    }

    onSetPassword(password);
    setOpen(false);
    setPassword("");
    setConfirmPassword("");
    setError("");
  };

  const handleRemovePassword = () => {
    onSetPassword(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isProtected ? "default" : "outline"}
          size="sm"
          className="px-2 sm:px-3"
        >
          {isProtected ? (
            <ShieldCheck className="h-4 w-4 sm:mr-2" />
          ) : (
            <Lock className="h-4 w-4 sm:mr-2" />
          )}
          <span className="hidden sm:inline">
            {isProtected ? t("password.protected") : t("password.secure")}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {isProtected ? t("password.updateProtection") : t("password.secureYourCode")}
          </DialogTitle>
          <DialogDescription>
            {isProtected ? t("password.updateDesc") : t("password.setDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t("password.passwordLabel")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("password.enterPassword")}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("password.confirmLabel")}</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder={t("password.confirmPassword")}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isProtected && (
            <Button
              variant="outline"
              onClick={handleRemovePassword}
              className="w-full sm:w-auto"
            >
              <Unlock className="h-4 w-4 mr-2" />
              {t("password.removeProtection")}
            </Button>
          )}
          <Button onClick={handleSubmit} className="w-full sm:w-auto">
            <ShieldCheck className="h-4 w-4 mr-2" />
            {isProtected ? t("password.updatePassword") : t("password.setPassword")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type EnterPasswordDialogProps = {
  onPasswordSubmit: (password: string) => boolean;
};

export function EnterPasswordDialog({
  onPasswordSubmit,
}: EnterPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const { t } = useTranslation();

  const handleSubmit = () => {
    if (!password) {
      setError(t("password.enterPrompt"));
      return;
    }

    const isCorrect = onPasswordSubmit(password);
    if (!isCorrect) {
      setAttempts((prev) => prev + 1);
      setError(`${t("password.incorrectPassword")} ${t("password.attemptsRemaining", { count: 3 - attempts - 1 })}`);
      if (attempts >= 2) {
        setError(t("password.tooManyAttempts"));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-2xl p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold">{t("password.protectedCode")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("password.protectedDesc")}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access-password">{t("password.passwordLabel")}</Label>
            <div className="relative">
              <Input
                id="access-password"
                type={showPassword ? "text" : "password"}
                placeholder={t("password.enterPassword")}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                disabled={attempts >= 3}
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={attempts >= 3}
          >
            <Unlock className="h-4 w-4 mr-2" />
            {t("password.unlockCode")}
          </Button>
        </div>
      </div>
    </div>
  );
}
