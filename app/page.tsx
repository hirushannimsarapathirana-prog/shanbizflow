import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let authenticated = false;

  if (token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET
      );

      await jwtVerify(token, secret);

      authenticated = true;
    } catch (error) {
      console.error("Invalid authentication token:", error);
    }
  }

  if (authenticated) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-sky-50">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-block rounded-full bg-sky-100 px-5 py-2 text-sm font-semibold text-sky-600">
              Welcome to ShanBizFlow
            </span>

            <h1 className="mt-8 text-5xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-7xl">
              Welcome to your
              <span className="block text-sky-500">
                smarter business.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              ShanBizFlow is a modern business management platform
              designed to help you manage your products, customers,
              sales, inventory and reports in one place.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-sky-500 px-7 py-3.5 font-semibold text-white shadow-sm transition hover:bg-sky-600"
              >
                Get Started
              </Link>

              <Link
                href="/login"
                className="rounded-xl border border-sky-200 bg-white px-7 py-3.5 font-semibold text-sky-600 transition hover:bg-sky-50"
              >
                Sign In
              </Link>
            </div>
          </div>

          <div className="mt-20 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-sky-100 bg-white p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-xl">
                📦
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                Manage Products
              </h2>

              <p className="mt-2 leading-7 text-slate-500">
                Keep your products, categories and stock organized
                from one place.
              </p>
            </div>

            <div className="rounded-3xl border border-sky-100 bg-white p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-xl">
                👥
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                Manage Customers
              </h2>

              <p className="mt-2 leading-7 text-slate-500">
                Manage customer information and keep track of
                your business relationships.
              </p>
            </div>

            <div className="rounded-3xl border border-sky-100 bg-white p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-xl">
                📊
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                Business Reports
              </h2>

              <p className="mt-2 leading-7 text-slate-500">
                Understand your business performance with useful
                sales and inventory reports.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}