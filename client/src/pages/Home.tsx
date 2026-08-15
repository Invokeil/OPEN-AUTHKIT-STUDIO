import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useLocation } from "wouter";
import {
  appConfig,
  isDemoMode,
  redirectToConfiguredAuth,
  type Provider,
} from "@/config";

const easeOut = [0.23, 1, 0.32, 1] as const;

const pageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, ease: easeOut, staggerChildren: 0.055 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.36, ease: easeOut } },
};

const providerLabels: Record<Provider, string> = {
  google: "Google",
  github: "GitHub",
  discord: "Discord",
  apple: "Apple",
};

function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === "google") {
    return (
      <svg
        className="provider-icon google-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M21.35 12.27c0-.72-.06-1.25-.2-1.8H12v3.41h5.37a4.59 4.59 0 0 1-1.99 3.02v2.5h3.22c1.89-1.74 2.75-4.31 2.75-7.13Z"
        />
        <path
          fill="currentColor"
          d="M12 21.6c2.7 0 4.97-.89 6.63-2.4l-3.22-2.5c-.89.6-2.02.96-3.41.96-2.62 0-4.84-1.77-5.64-4.15H3.03v2.58A10 10 0 0 0 12 21.6Z"
        />
        <path
          fill="currentColor"
          d="M6.36 13.51a6 6 0 0 1-.32-1.91c0-.66.11-1.3.32-1.91V7.11H3.03A9.98 9.98 0 0 0 2 11.6c0 1.61.39 3.13 1.03 4.49l3.33-2.58Z"
        />
        <path
          fill="currentColor"
          d="M12 5.54c1.52 0 2.88.52 3.95 1.55l2.96-2.96C16.96 2.52 14.7 1.6 12 1.6a10 10 0 0 0-8.97 5.51l3.33 2.58C7.16 7.31 9.38 5.54 12 5.54Z"
        />
      </svg>
    );
  }
  if (provider === "github") {
    return (
      <svg
        className="provider-icon github-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.18c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.57-.29-5.28-1.29-5.28-5.74 0-1.27.45-2.3 1.2-3.11-.12-.3-.52-1.47.11-3.07 0 0 .98-.31 3.18 1.19a11.04 11.04 0 0 1 5.79 0c2.2-1.5 3.18-1.19 3.18-1.19.63 1.6.23 2.77.11 3.07.75.81 1.2 1.84 1.2 3.11 0 4.46-2.71 5.45-5.29 5.73.42.36.78 1.08.78 2.18v3.23c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"
        />
      </svg>
    );
  }
  if (provider === "discord") {
    return (
      <svg
        className="provider-icon discord-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M19.54 5.35A16.7 16.7 0 0 0 15.4 4l-.5 1.02a15.3 15.3 0 0 0-5.8 0L8.6 4a16.7 16.7 0 0 0-4.14 1.35C1.84 9.43 1.13 13.4 1.49 17.31a16.7 16.7 0 0 0 5.1 2.59l1.24-1.68c-.68-.25-1.34-.56-1.96-.94l.48-.37c3.78 1.76 7.88 1.76 11.61 0l.49.37c-.62.38-1.28.69-1.96.94l1.24 1.68a16.7 16.7 0 0 0 5.1-2.59c.43-4.53-.73-8.46-3.29-11.96ZM8.72 14.8c-1.12 0-2.05-1.03-2.05-2.3s.91-2.3 2.05-2.3 2.07 1.03 2.05 2.3c0 1.27-.91 2.3-2.05 2.3Zm6.56 0c-1.12 0-2.05-1.03-2.05-2.3-1.12 0-2.05-1.03-2.05-2.3s.91-2.3 2.05-2.3 2.07 1.03 2.05 2.3c0 1.27-.91 2.3-2.05 2.3Z"
        />
      </svg>
    );
  }
  return (
    <svg
      className="provider-icon apple-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M17.05 12.54c-.02-2.16 1.76-3.2 1.84-3.25a3.95 3.95 0 0 0-3.11-1.68c-1.31-.14-2.58.78-3.25.78-.68 0-1.73-.76-2.84-.74a4.18 4.18 0 0 0-3.51 2.14c-1.52 2.63-.39 6.5 1.07 8.62.73 1.04 1.58 2.2 2.7 2.16 1.09-.04 1.5-.7 2.81-.7 1.31 0 1.68.7 2.82.67 1.17-.02 1.91-1.05 2.62-2.1a8.6 8.6 0 0 0 1.2-2.43 3.78 3.78 0 0 1-2.35-3.47Zm-2.14-6.32a3.8 3.8 0 0 0 .87-2.72 3.87 3.87 0 0 0-2.5 1.3 3.62 3.62 0 0 0-.9 2.62 3.22 3.22 0 0 0 2.53-1.2Z"
      />
    </svg>
  );
}

function AnimatedWordmark({
  compact = false,
  decorative = false,
}: {
  compact?: boolean;
  decorative?: boolean;
}) {
  return (
    <motion.img
      className={`brand-wordmark${compact ? " compact-wordmark" : ""}`}
      src={appConfig.logoSrc}
      alt={decorative ? "" : appConfig.brandName}
      aria-hidden={decorative || undefined}
      initial={{ opacity: 0, scale: 0.96, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.42, ease: easeOut }}
    />
  );
}

function InlineWordmark({
  compact = false,
  tone = "ink",
}: {
  compact?: boolean;
  tone?: "ink" | "moss" | "faint";
}) {
  return (
    <motion.span
      className={`inline-wordmark-text inline-wordmark-${compact ? "compact" : "heading"} inline-wordmark-${tone}`}
      role="img"
      aria-label={appConfig.brandName}
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: easeOut }}
    >
      {appConfig.brandName}
    </motion.span>
  );
}

function LoadingScreen() {
  return (
    <motion.div
      className="loading-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.38 }}
      aria-label={`Loading ${appConfig.brandName} authorization`}
    >
      <motion.div
        className="loading-orb"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.62, ease: easeOut }}
      >
        <motion.div
          className="loading-orb-ring"
          animate={{ rotate: 360 }}
          transition={{ duration: 7, ease: "linear", repeat: Infinity }}
        />
        <AnimatedWordmark compact decorative />
      </motion.div>
      <motion.div
        className="loading-copy"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.32 }}
      >
        <AnimatedWordmark compact />
        <span>
          {isDemoMode()
            ? "Preparing local demo"
            : "Preparing secure authorization"}
        </span>
      </motion.div>
      <div className="loading-progress" aria-hidden="true">
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.84, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function Home() {
  const [location] = useLocation();
  const isSignup = location === "/signup";
  const reduceMotion = useReducedMotion();
  const [isInitializing, setIsInitializing] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"email" | "password" | "signup" | "done">(
    isSignup ? "signup" : "email"
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [authorizingProvider, setAuthorizingProvider] =
    useState<Provider | null>(null);
  const [demoProvider, setDemoProvider] = useState<Provider | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setIsInitializing(false),
      reduceMotion ? 120 : 920
    );
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  useEffect(() => {
    setStep(isSignup ? "signup" : "email");
    setError("");
    setNotice("");
    document.title = isSignup
      ? `Create your ${appConfig.brandName} account`
      : `Continue with ${appConfig.brandName}`;
  }, [isSignup]);

  const completeDemo = (provider?: Provider) => {
    setLoading(true);
    window.setTimeout(
      () => {
        setLoading(false);
        setAuthorizingProvider(null);
        setDemoProvider(provider || null);
        setStep("done");
      },
      reduceMotion ? 120 : provider ? 840 : 720
    );
  };

  const submitEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");
    if (!validEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    if (!isDemoMode()) {
      if (!redirectToConfiguredAuth("login"))
        setError("Set VITE_AUTH_LOGIN_URL before using redirect mode.");
      return;
    }
    setStep("password");
  };

  const submitSignup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Enter your name to continue.");
      return;
    }
    if (!validEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!accepted) {
      setError("Accept the terms and privacy policy to continue.");
      return;
    }
    if (!isDemoMode()) {
      if (!redirectToConfiguredAuth("signup"))
        setError("Set VITE_AUTH_SIGNUP_URL before using redirect mode.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your demo password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    completeDemo();
  };

  const submitPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password.trim()) {
      setError("Enter the demo password to continue.");
      return;
    }
    setError("");
    completeDemo();
  };

  const reset = () => {
    setStep(isSignup ? "signup" : "email");
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setAccepted(false);
    setShowPassword(false);
    setError("");
    setNotice("");
    setLoading(false);
    setAuthorizingProvider(null);
    setDemoProvider(null);
  };

  const chooseProvider = (provider: Provider) => {
    if (loading) return;
    setError("");
    setNotice("");
    if (!isDemoMode()) {
      if (!redirectToConfiguredAuth(isSignup ? "signup" : "login", provider)) {
        setError(
          `Set VITE_AUTH_PROVIDER_URL_${provider.toUpperCase()} or the shared auth URL first.`
        );
      }
      return;
    }
    setAuthorizingProvider(provider);
    setLoading(true);
    setEmail(`${provider}.demo@example.test`);
    completeDemo(provider);
  };

  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.22, ease: easeOut }}
    >
      <AnimatePresence mode="wait">
        {isInitializing && <LoadingScreen />}
      </AnimatePresence>
      <motion.main
        className="auth-shell"
        style={{ "--brand-accent": appConfig.accent } as React.CSSProperties}
        variants={pageVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <aside
          className="brand-rail"
          aria-label={`${appConfig.brandName} branding`}
        >
          <motion.div className="rail-topline" variants={itemVariants}>
            <AnimatedWordmark />
          </motion.div>
          <motion.div className="rail-art" aria-hidden="true">
            <span />
            <span />
            <span />
          </motion.div>
          <motion.div className="rail-caption" variants={itemVariants}>
            <span className="rail-caption-line" />
            <p>{appConfig.tagline}</p>
          </motion.div>
        </aside>

        <section className="auth-stage">
          <motion.header className="mobile-header" variants={itemVariants}>
            <AnimatedWordmark />
          </motion.header>
          <motion.div className="auth-card" variants={pageVariants} layout>
            <AnimatePresence mode="wait" initial={false}>
              {step === "done" ? (
                <motion.div
                  key="done"
                  className="success-state"
                  variants={pageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  aria-live="polite"
                >
                  <motion.div
                    className="success-icon"
                    initial={{ scale: 0.75, rotate: -12 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 22 }}
                  >
                    <Check size={20} strokeWidth={2.5} />
                  </motion.div>
                  <motion.p className="eyebrow" variants={itemVariants}>
                    {isSignup
                      ? "Demo account created"
                      : "Demo authorization complete"}
                  </motion.p>
                  <motion.h1 variants={itemVariants}>
                    {isDemoMode()
                      ? "You’re all set."
                      : "Returning to your app."}
                  </motion.h1>
                  <motion.p className="auth-copy" variants={itemVariants}>
                    {demoProvider ? (
                      <>
                        Local demo authorization completed with{" "}
                        <strong>{providerLabels[demoProvider]}</strong> for{" "}
                        <strong>{email}</strong>. No external account or
                        credentials were used.
                      </>
                    ) : isSignup ? (
                      <>
                        This local demo created a temporary success state for{" "}
                        <strong>{email}</strong>. No account was stored.
                      </>
                    ) : (
                      <>
                        This local demo completed the sign-in animation for{" "}
                        <strong>{email}</strong>. No password was sent anywhere.
                      </>
                    )}
                  </motion.p>
                  <motion.button
                    className="secondary-button"
                    type="button"
                    onClick={reset}
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.975 }}
                  >
                    Start again
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key={step}
                  variants={pageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  layout
                >
                  <motion.div className="auth-heading" variants={itemVariants}>
                    <p className="eyebrow">
                      <Sparkles size={12} />
                      <InlineWordmark compact tone="moss" />{" "}
                      {isDemoMode() ? "local demo" : "authorization"}
                    </p>
                    <h1>
                      {isSignup
                        ? `Create your ${appConfig.brandName} account`
                        : step === "email"
                          ? `Continue with ${appConfig.brandName}`
                          : "Enter your demo password"}
                    </h1>
                    <p className="auth-copy">
                      {isDemoMode()
                        ? "Try the complete flow with safe, local-only demo data."
                        : "Continue with your configured identity provider. Passwords are handled by that provider, not this browser UI."}
                    </p>
                  </motion.div>

                  {isSignup ? (
                    <motion.form
                      className="auth-form signup-form"
                      onSubmit={submitSignup}
                      noValidate
                      variants={itemVariants}
                    >
                      <div className="name-grid">
                        <div className="field-stack">
                          <label htmlFor="first-name">Name</label>
                          <input
                            id="first-name"
                            name="firstName"
                            type="text"
                            autoComplete="given-name"
                            placeholder="Your name"
                            value={name}
                            onChange={event => {
                              setName(event.target.value);
                              setError("");
                            }}
                            autoFocus={!isInitializing}
                          />
                        </div>
                        <div className="field-stack">
                          <label htmlFor="signup-email">Email address</label>
                          <input
                            id="signup-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={event => {
                              setEmail(event.target.value);
                              setError("");
                            }}
                          />
                        </div>
                      </div>
                      {isDemoMode() && (
                        <>
                          <label htmlFor="signup-password">Demo password</label>
                          <div className="password-wrap">
                            <input
                              id="signup-password"
                              name="password"
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="At least 8 characters"
                              value={password}
                              onChange={event => {
                                setPassword(event.target.value);
                                setError("");
                              }}
                              aria-invalid={Boolean(error)}
                            />
                            <motion.button
                              type="button"
                              className="password-toggle"
                              onClick={() =>
                                setShowPassword(visible => !visible)
                              }
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {showPassword ? (
                                <EyeOff size={17} />
                              ) : (
                                <Eye size={17} />
                              )}
                            </motion.button>
                          </div>
                          <label htmlFor="confirm-password">
                            Confirm demo password
                          </label>
                          <input
                            id="confirm-password"
                            name="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Re-enter your demo password"
                            value={confirmPassword}
                            onChange={event => {
                              setConfirmPassword(event.target.value);
                              setError("");
                            }}
                          />
                        </>
                      )}
                      <div className="consent-row">
                        <input
                          className="checkbox-control"
                          id="signup-consent"
                          type="checkbox"
                          checked={accepted}
                          onChange={event => {
                            setAccepted(event.target.checked);
                            setError("");
                          }}
                        />
                        <label
                          className="consent-label"
                          htmlFor="signup-consent"
                        >
                          I agree to the{" "}
                          <a className="inline-link" href={appConfig.termsUrl}>
                            Terms
                          </a>{" "}
                          and{" "}
                          <a
                            className="inline-link"
                            href={appConfig.privacyUrl}
                          >
                            Privacy Policy
                          </a>
                          .
                        </label>
                      </div>
                      <motion.button
                        className="primary-button"
                        type="submit"
                        disabled={loading}
                        whileHover={
                          !loading
                            ? {
                                y: -2,
                                boxShadow: "0 10px 22px rgba(17,17,17,.12)",
                              }
                            : undefined
                        }
                        whileTap={!loading ? { scale: 0.975 } : undefined}
                      >
                        {loading ? (
                          <>
                            <LoaderCircle className="spin" size={16} /> Creating
                            demo
                          </>
                        ) : (
                          <>
                            <span>
                              {isDemoMode()
                                ? "Create demo account"
                                : "Continue to signup"}
                            </span>
                            <ArrowUpRight size={16} />
                          </>
                        )}
                      </motion.button>
                      <AnimatePresence>
                        {error && (
                          <motion.p
                            id="signup-error"
                            className="form-error"
                            role="alert"
                            initial={{ opacity: 0, height: 0, y: -4 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            {error}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.form>
                  ) : step === "email" ? (
                    <motion.form
                      className="auth-form"
                      onSubmit={submitEmail}
                      noValidate
                      variants={itemVariants}
                    >
                      <label htmlFor="email">Email address</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder={
                          isDemoMode() ? appConfig.demoEmail : "you@example.com"
                        }
                        value={email}
                        onChange={event => {
                          setEmail(event.target.value);
                          setError("");
                        }}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? "form-error" : undefined}
                        autoFocus={!isInitializing}
                      />
                      <motion.button
                        className="primary-button"
                        type="submit"
                        disabled={loading}
                        whileHover={
                          !loading
                            ? {
                                y: -2,
                                boxShadow: "0 10px 22px rgba(17,17,17,.12)",
                              }
                            : undefined
                        }
                        whileTap={!loading ? { scale: 0.975 } : undefined}
                      >
                        <span>
                          {isDemoMode() ? "Continue" : "Continue securely"}
                        </span>
                        <motion.span initial={{ x: 0 }} whileHover={{ x: 3 }}>
                          <ArrowUpRight size={16} />
                        </motion.span>
                      </motion.button>
                      <AnimatePresence>
                        {error && (
                          <motion.p
                            id="form-error"
                            className="form-error"
                            role="alert"
                            initial={{ opacity: 0, height: 0, y: -4 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            {error}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.form>
                  ) : (
                    <motion.form
                      className="auth-form"
                      onSubmit={submitPassword}
                      noValidate
                      variants={itemVariants}
                    >
                      <div className="account-chip">
                        <motion.span
                          className="account-avatar"
                          initial={{ scale: 0.7 }}
                          animate={{ scale: 1 }}
                        >
                          {email.charAt(0).toUpperCase()}
                        </motion.span>
                        <span>{email}</span>
                        <motion.button
                          type="button"
                          onClick={reset}
                          aria-label="Change email address"
                          whileHover={{ rotate: -8, scale: 1.1 }}
                        >
                          <ChevronDown size={15} />
                        </motion.button>
                      </div>
                      <label htmlFor="password">Demo password</label>
                      <div className="password-wrap">
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder={appConfig.demoPassword}
                          value={password}
                          onChange={event => {
                            setPassword(event.target.value);
                            setError("");
                          }}
                          aria-invalid={Boolean(error)}
                          aria-describedby={error ? "form-error" : undefined}
                          autoFocus
                        />
                        <motion.button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowPassword(visible => !visible)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {showPassword ? (
                            <EyeOff size={17} />
                          ) : (
                            <Eye size={17} />
                          )}
                        </motion.button>
                      </div>
                      <p className="demo-hint">
                        Demo only: use any non-empty password. Nothing is stored
                        or transmitted.
                      </p>
                      <motion.button
                        className="primary-button"
                        type="submit"
                        disabled={loading}
                        whileHover={
                          !loading
                            ? {
                                y: -2,
                                boxShadow: "0 10px 22px rgba(17,17,17,.12)",
                              }
                            : undefined
                        }
                        whileTap={!loading ? { scale: 0.975 } : undefined}
                      >
                        {loading ? (
                          <>
                            <LoaderCircle className="spin" size={16} /> Checking
                            demo
                          </>
                        ) : (
                          <>
                            <span>Complete demo</span>
                            <ArrowUpRight size={16} />
                          </>
                        )}
                      </motion.button>
                      <AnimatePresence>
                        {error && (
                          <motion.p
                            id="form-error"
                            className="form-error"
                            role="alert"
                            initial={{ opacity: 0, height: 0, y: -4 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            {error}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.form>
                  )}

                  {(step === "email" || isSignup) && (
                    <motion.div variants={itemVariants}>
                      <div className="or-divider">
                        <span />
                        or
                        <span />
                      </div>
                      <div className="social-stack">
                        {appConfig.providers.map(provider => {
                          const authorizing = authorizingProvider === provider;
                          return (
                            <motion.button
                              key={provider}
                              className={`social-button${authorizing ? " provider-authorizing" : ""}`}
                              type="button"
                              disabled={loading}
                              onClick={() => chooseProvider(provider)}
                              whileHover={
                                !loading
                                  ? {
                                      y: -2,
                                      borderColor: "#111111",
                                      backgroundColor: "rgba(255,255,255,.7)",
                                    }
                                  : undefined
                              }
                              whileTap={!loading ? { scale: 0.98 } : undefined}
                            >
                              {authorizing ? (
                                <LoaderCircle
                                  className="spin provider-icon"
                                  size={17}
                                />
                              ) : (
                                <ProviderIcon provider={provider} />
                              )}{" "}
                              <span>
                                {authorizing
                                  ? `Authorizing with ${providerLabels[provider]}`
                                  : `${isSignup ? "Sign up with " : "Continue with "}${providerLabels[provider]}`}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                  <motion.p className="account-prompt" variants={itemVariants}>
                    {isSignup
                      ? "Already have an account?"
                      : "Don’t have an account?"}{" "}
                    <a
                      className="inline-link"
                      href={isSignup ? "/" : "/signup"}
                    >
                      {isSignup ? "Sign in" : "Sign up"}
                    </a>
                  </motion.p>
                  <AnimatePresence>
                    {notice && (
                      <motion.p
                        className="provider-notice"
                        role="status"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                      >
                        <ShieldCheck size={14} />
                        {notice}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <motion.footer className="auth-footer" variants={itemVariants}>
            <span>
              © 2026 <InlineWordmark compact tone="faint" />
            </span>
            <span className="footer-dot">·</span>
            <a href={appConfig.privacyUrl}>Privacy</a>
            <span className="footer-dot">·</span>
            <a href={appConfig.termsUrl}>Terms</a>
          </motion.footer>
        </section>
      </motion.main>
    </MotionConfig>
  );
}
