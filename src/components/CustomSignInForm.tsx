import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function CustomSignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  
  // Check for invite code in URL
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const inviteFromUrl = urlParams.get('invite');
      if (inviteFromUrl && inviteFromUrl.trim()) {
        setInviteCode(inviteFromUrl.trim());
        setFlow("signUp");
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error("Error processing invite URL:", error);
    }
  }, []);

  const isValidInvite = useQuery(
    api.users.validateInviteCode,
    inviteCode.trim() ? { code: inviteCode.trim() } : "skip"
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      formData.set("flow", flow);

      // For signup, validate invite code first
      if (flow === "signUp") {
        if (!inviteCode.trim()) {
          toast.error("Invite code is required to sign up");
          setSubmitting(false);
          return;
        }
        if (!isValidInvite) {
          toast.error("Invalid or expired invite code");
          setSubmitting(false);
          return;
        }
      }

      // Store invite code for post-signup processing
      if (flow === "signUp" && inviteCode.trim()) {
        localStorage.setItem('pendingInviteCode', inviteCode.trim());
      }

      await signIn("password", formData);
    } catch (error: any) {
      let toastTitle = "";
      if (error.message.includes("Invalid password")) {
        toastTitle = "Invalid password. Please try again.";
      } else {
        toastTitle =
          flow === "signIn"
            ? "Could not sign in, did you mean to sign up?"
            : "Could not sign up, did you mean to sign in?";
      }
      toast.error(toastTitle);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <form className="flex flex-col gap-form-field" onSubmit={handleSubmit}>
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        
        {flow === "signUp" && (
          <div>
            <input
              className="auth-input-field"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Invite Code"
              required
            />
            {inviteCode.trim() && (
              <p className={`text-xs mt-1 ${isValidInvite ? 'text-green-600' : 'text-red-600'}`}>
                {isValidInvite ? '✓ Valid invite code' : '✗ Invalid or expired invite code'}
              </p>
            )}
          </div>
        )}
        
        <button 
          className="auth-button" 
          type="submit" 
          disabled={submitting || (flow === "signUp" && (!inviteCode.trim() || !isValidInvite))}
        >
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        
        <div className="text-center text-sm text-secondary">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
        
        {flow === "signUp" && (
          <div className="text-center text-xs text-gray-500 mt-2">
            Need an invite code? Ask an existing user to share one with you.
          </div>
        )}
      </form>
      

    </div>
  );
}
