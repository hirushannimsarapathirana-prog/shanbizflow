"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Login request failed:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-sky-50 px-4 py-8 sm:px-6 sm:py-12 md:py-16">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center sm:min-h-[calc(100vh-6rem)]">
        <div className="w-full min-w-0 rounded-3xl border border-sky-100 bg-white p-5 shadow-xl shadow-sky-100/50 sm:p-7 md:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Welcome Back
            </h1>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Sign in to your ShanBizFlow account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                className="w-full min-w-0 rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 sm:text-base"
              />
            </div>

            <div className="min-w-0">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full min-w-0 rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 sm:text-base"
              />
            </div>

            {error && (
              <div className="w-full rounded-xl bg-red-50 px-4 py-3 text-sm font-medium leading-5 text-red-600 break-words">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm leading-6 text-slate-500 sm:mt-6">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-sky-600 hover:text-sky-700"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

