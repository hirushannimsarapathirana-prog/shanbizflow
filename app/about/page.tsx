import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">

      {/* Hero */}
      <section className="bg-sky-50 dark:bg-slate-950">

        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">

          <div className="mx-auto max-w-4xl text-center">

            <span className="inline-flex rounded-full bg-sky-100 px-5 py-2 text-sm font-semibold text-sky-600 dark:bg-sky-950 dark:text-sky-400">
              About ShanBizFlow
            </span>

            <h1 className="mt-7 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
              Built to make
              <span className="block text-sky-500">
                business management easier.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
              ShanBizFlow is a modern business management
              platform that brings important business operations
              together into one organized workspace.
            </p>

          </div>

        </div>

      </section>

      {/* Story */}
      <section className="bg-white py-20 dark:bg-slate-950">

        <div className="mx-auto max-w-6xl px-6">

          <div className="grid gap-12 lg:grid-cols-2">

            <div>

              <p className="text-sm font-semibold uppercase tracking-wider text-sky-500">
                Why ShanBizFlow
              </p>

              <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
                Business operations should not be complicated.
              </h2>

            </div>

            <div className="space-y-5 text-slate-600 dark:text-slate-400">

              <p className="leading-8">
                Businesses handle information every day.
                Products need to be managed, customers need
                to be organized, sales need to be recorded,
                and payments need to be tracked.
              </p>

              <p className="leading-8">
                ShanBizFlow brings these operations together
                so business information can be managed from
                a single system.
              </p>

              <p className="leading-8">
                The platform is designed around a clean,
                straightforward experience so users can focus
                on running their business rather than managing
                complicated software.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* Values */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900">

        <div className="mx-auto max-w-7xl px-6">

          <div className="mx-auto max-w-2xl text-center">

            <p className="text-sm font-semibold uppercase tracking-wider text-sky-500">
              Our Approach
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
              Designed around your workflow
            </h2>

          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">

            <div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-950">

              <div className="text-3xl">
                🎯
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
                Focus
              </h3>

              <p className="mt-3 leading-7 text-slate-500 dark:text-slate-400">
                Keep important business information easy to
                access and understand.
              </p>

            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-950">

              <div className="text-3xl">
                ⚙️
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
                Efficiency
              </h3>

              <p className="mt-3 leading-7 text-slate-500 dark:text-slate-400">
                Bring everyday business tasks into one
                connected workflow.
              </p>

            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-950">

              <div className="text-3xl">
                📈
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
                Visibility
              </h3>

              <p className="mt-3 leading-7 text-slate-500 dark:text-slate-400">
                Use organized business data to understand
                what is happening in your operations.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* Modules */}
      <section className="bg-white py-20 dark:bg-slate-950">

        <div className="mx-auto max-w-6xl px-6">

          <div className="text-center">

            <p className="text-sm font-semibold uppercase tracking-wider text-sky-500">
              Platform
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
              One system, connected modules
            </h2>

          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {[
              "Products",
              "Customers",
              "Sales",
              "Inventory",
              "Payments",
              "Reports",
              "User Management",
              "Settings",
            ].map((module) => (
              <div
                key={module}
                className="rounded-2xl border border-sky-100 bg-sky-50 p-5 text-center font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                {module}
              </div>
            ))}

          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="bg-sky-500 py-16">

        <div className="mx-auto max-w-4xl px-6 text-center">

          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Manage your business with ShanBizFlow
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-sky-100">
            Create your account and start organizing your
            business operations in one place.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-flex rounded-xl bg-white px-7 py-3.5 font-semibold text-sky-600 transition hover:bg-sky-50"
          >
            Get Started
          </Link>

        </div>

      </section>

    </main>
  );
}