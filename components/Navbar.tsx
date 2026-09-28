import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-sky-100 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div>
          <Link href="/">
            <h1 className="text-2xl font-bold tracking-tight text-sky-600">
              ShanBizFlow
            </h1>
          </Link>

          <p className="text-xs text-slate-400">
            Business Management
          </p>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="font-medium text-slate-700 transition hover:text-sky-600"
          >
            Home
          </Link>

          <Link
            href="/about"
            className="font-medium text-slate-700 transition hover:text-sky-600"
          >
            About
          </Link>

          <Link
            href="/login"
            className="font-medium text-slate-700 transition hover:text-sky-600"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-full bg-sky-500 px-6 py-2.5 font-semibold text-white transition hover:bg-sky-600"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}