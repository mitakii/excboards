import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useLocation, useNavigate } from "react-router-dom";
import { FieldError } from "@/components/ui/field";
import { useTheme } from "@/components/theme-provider";
import { getErrorMessage } from "@/lib/api";
import { useGoogleLogin } from "../queries";
import { googleClientId, type GoogleSignupState } from "../google";

export function GoogleSignInButton({ text }: { text: "signin_with" | "signup_with" }) {
  const googleLogin = useGoogleLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const [error, setError] = useState<string | null>(null);

  if (!googleClientId) return null;

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";

  async function onCredential(idToken: string) {
    setError(null);
    try {
      const res = await googleLogin.mutateAsync(idToken);
      if (res.needsUsername) {
        const state: GoogleSignupState = { idToken, suggestedUsername: res.suggestedUsername, from };
        navigate("/signup/google", { state });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err, "Google sign-in failed."));
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <GoogleLogin
        text={text}
        theme={resolvedTheme === "dark" ? "filled_black" : "outline"}
        width={320}
        onSuccess={({ credential }) => credential && onCredential(credential)}
        onError={() => setError("Google sign-in failed.")}
      />
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
