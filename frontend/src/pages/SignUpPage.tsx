import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, hasFirebaseConfig } from "../lib/firebase";

function mapSignUpError(errorCode: string) {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please sign in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    default:
      return "Sign up failed. Please check your details and try again.";
  }
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!hasFirebaseConfig || !auth) {
      setError("Firebase is not configured yet. Add keys to .env and restart dev server.");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }

    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (fullName) {
        await updateProfile(userCredential.user, { displayName: fullName });
      }
      setMessage(`Account created${companyName ? ` for ${companyName}` : ""}. You can now sign in.`);
      navigate("/dashboard");
    } catch (error: any) {
      const errorCode = error?.code || "unknown";
      const errorMessage = error?.message || "unknown error";
      setError(mapSignUpError(errorCode) + ` (${errorMessage})`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setError("");
    setMessage("");

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
        setError("Google sign up was cancelled.");
        return;
      }
      setError(`Google sign up failed: ${errorMessage} (${errorCode})`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f2f7f1] px-5 py-12">
      <div className="absolute -left-28 -top-16 h-72 w-72 rounded-full bg-emerald-300/35 blur-3xl" />
      <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-lime-200/35 blur-3xl" />
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/70 bg-white/85 p-8 shadow-2xl backdrop-blur-xl">
        <Link to="/" className="loopx-logo text-3xl">
          Loopx
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Create your free account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Start building high-converting email, SMS, and WhatsApp outreach journeys in minutes.
        </p>

        <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleSignUp}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">First name</span>
            <input
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-300/80 bg-white px-4 py-3 outline-none ring-emerald-500 transition focus:ring-2"
              placeholder="Suren"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Last name</span>
            <input
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-300/80 bg-white px-4 py-3 outline-none ring-emerald-500 transition focus:ring-2"
              placeholder="Kotian"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700">Work email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-300/80 bg-white px-4 py-3 outline-none ring-emerald-500 transition focus:ring-2"
              placeholder="you@company.com"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700">Company name</span>
            <input
              type="text"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              className="w-full rounded-xl border border-slate-300/80 bg-white px-4 py-3 outline-none ring-emerald-500 transition focus:ring-2"
              placeholder="Loopx"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-slate-300/80 bg-white px-4 py-3 outline-none ring-emerald-500 transition focus:ring-2"
              placeholder="Create password"
            />
          </label>
          {error && <p className="text-sm font-medium text-red-600 md:col-span-2">{error}</p>}
          {message && <p className="text-sm font-medium text-emerald-700 md:col-span-2">{message}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignUp}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2"
          >
            Continue with Google
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/sign-in" className="font-semibold text-emerald-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
