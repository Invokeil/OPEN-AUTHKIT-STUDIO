import { useLocation } from "wouter";
import { appConfig } from "@/config";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <p className="eyebrow">{appConfig.brandName}</p>
        <h1>Page not found</h1>
        <p className="auth-copy">
          The page you requested does not exist or is no longer available.
        </p>
        <button
          className="primary-button"
          type="button"
          onClick={() => setLocation("/")}
        >
          Return home
        </button>
      </div>
    </main>
  );
}
