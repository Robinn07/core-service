import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, hasFirebaseConfig } from "../lib/firebase";

function mapSignInError(errorCode: string) {
  switch (errorCode) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Incorrect email or password. Please try again.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a bit and try again.";
    default:
      return "Sign in failed. Please try again.";
  }
}

export default function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!hasFirebaseConfig || !auth) {
      setError("Firebase is not configured yet. Add keys to .env and restart dev server.");
      return;
    }

    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setMessage("Signed in successfully.");
      navigate("/dashboard");
    } catch (error: any) {
      const errorCode = error?.code || "unknown";
      const errorMessage = error?.message || "unknown error";
      setError(mapSignInError(errorCode) + ` (${errorMessage})`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setMessage("");
    setError("");

    if (!hasFirebaseConfig || !auth) {
      setError("Firebase is not configured yet. Add keys to .env and restart dev server.");
      return;
    }

    try {
      setIsLoading(true);
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate("/dashboard");
    } catch (error: any) {
      const errorCode = error?.code || "unknown";
      const errorMessage = error?.message || "unknown error";
      if (errorCode === "auth/popup-closed-by-user") {
        setError("Google sign in was cancelled.");
        return;
      }
      setError(`Google sign in failed: ${errorMessage} (${errorCode})`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f2f7f1] px-5 py-12">
      <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-emerald-300/40 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-lime-200/40 blur-3xl" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/70 bg-white/85 p-8 shadow-2xl backdrop-blur-xl">
        <Link to="/" className="loopx-logo text-3xl">
          Loopx
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Sign in to your account</h1>
        <p className="mt-2 text-sm text-slate-600">Welcome back. Continue your outreach workflows in seconds.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSignIn}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Work email</span>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-300/80 bg-white px-4 py-3 outline-none ring-emerald-500 transition focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-300/80 bg-white px-4 py-3 outline-none ring-emerald-500 transition focus:ring-2"
            />
          </label>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {message && <p className="text-sm font-medium text-emerald-700">{message}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Continue with Google
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          New to Loopx?{" "}
          <Link to="/sign-up" className="font-semibold text-emerald-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
