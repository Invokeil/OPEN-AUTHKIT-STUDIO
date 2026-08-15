export type AuthMode = "demo" | "redirect";

export type Provider = "google" | "github" | "discord" | "apple";

const DEMO_EMAIL = "demo@example.test";
const DEMO_PASSWORD = "demo-pass-1234";

function env(name: string): string | undefined {
  const value = import.meta.env[name] as string | undefined;
  return value?.trim() || undefined;
}

function safeText(
  value: string | undefined,
  fallback: string,
  maxLength = 80
): string {
  if (!value) return fallback;
  return (
    value
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .slice(0, maxLength)
      .trim() || fallback
  );
}

function safeAssetUrl(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  if (value.startsWith("/")) return value;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : fallback;
  } catch {
    return fallback;
  }
}

function safeHttpUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("/")) return value;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "https:") return parsed.toString();
    if (
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    ) {
      return parsed.toString();
    }
  } catch {
    // Ignore invalid public configuration and stay in the safe demo flow.
  }
  return undefined;
}

function safeHex(value: string | undefined, fallback: string): string {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function parseProviders(value: string | undefined): Provider[] {
  const allowed: Provider[] = ["google", "github", "discord", "apple"];
  const configured = (value || "google,github,discord,apple")
    .split(",")
    .map(provider => provider.trim().toLowerCase())
    .filter((provider): provider is Provider =>
      allowed.includes(provider as Provider)
    );
  return configured.length > 0
    ? Array.from(new Set(configured))
    : ["google", "github", "discord"];
}

const configuredAuthMode = env("VITE_AUTH_MODE");
const authMode: AuthMode =
  configuredAuthMode === "redirect" ? "redirect" : "demo";

export const appConfig = Object.freeze({
  brandName: safeText(env("VITE_BRAND_NAME"), "Open Auth Kit"),
  logoSrc: safeAssetUrl(env("VITE_BRAND_LOGO"), "/logo.svg"),
  tagline: safeText(
    env("VITE_BRAND_TAGLINE"),
    "One account. Everywhere you build."
  ),
  accent: safeHex(env("VITE_BRAND_ACCENT"), "#667161"),
  authMode,
  authLoginUrl: safeHttpUrl(env("VITE_AUTH_LOGIN_URL")),
  authSignupUrl: safeHttpUrl(env("VITE_AUTH_SIGNUP_URL")),
  privacyUrl: safeHttpUrl(env("VITE_PRIVACY_URL")) || "#privacy",
  termsUrl: safeHttpUrl(env("VITE_TERMS_URL")) || "#terms",
  providers: parseProviders(env("VITE_AUTH_PROVIDERS")),
  demoEmail: safeText(env("VITE_DEMO_EMAIL"), DEMO_EMAIL, 120),
  demoPassword: safeText(env("VITE_DEMO_PASSWORD"), DEMO_PASSWORD, 120),
});

export function isDemoMode(): boolean {
  return appConfig.authMode === "demo";
}

export function providerUrl(provider: Provider): string | undefined {
  const configured = safeHttpUrl(
    env(`VITE_AUTH_PROVIDER_URL_${provider.toUpperCase()}`)
  );
  return configured || appConfig.authLoginUrl;
}

export function redirectToConfiguredAuth(
  kind: "login" | "signup",
  provider?: Provider
): boolean {
  const target = provider
    ? providerUrl(provider)
    : kind === "signup"
      ? appConfig.authSignupUrl
      : appConfig.authLoginUrl;
  if (!target) return false;

  const url = new URL(target, window.location.origin);
  url.searchParams.set(
    "redirect_uri",
    `${window.location.origin}/auth/callback`
  );
  url.searchParams.set("client", appConfig.brandName);
  if (provider) url.searchParams.set("provider", provider);
  window.location.assign(url.toString());
  return true;
}
