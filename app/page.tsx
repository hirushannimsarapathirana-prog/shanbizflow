import Link from "next/link";

const features = [
  {
    icon: "📦",
    title: "Product Management",
    description:
      "Manage products, prices, categories and stock from one centralized platform.",
  },
  {
    icon: "👥",
    title: "Customer Management",
    description:
      "Keep customer information organized and easily manage your business relationships.",
  },
  {
    icon: "💰",
    title: "Sales Management",
    description:
      "Create sales, manage invoices and track payment status with ease.",
  },
  {
    icon: "📊",
    title: "Inventory Tracking",
    description:
      "Monitor your stock levels and quickly identify products that need attention.",
  },
  {
    icon: "💳",
    title: "Payment Management",
    description:
      "Record payments and keep track of outstanding customer balances.",
  },
  {
    icon: "📈",
    title: "Business Reports",
    description:
      "View useful business information through sales and performance reports.",
  },
];

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
              Everything your business needs,
              <span className="block text-sky-500">
                in one place.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
              ShanBizFlow is a modern business management system
              designed to simplify everyday business operations.
              Manage products, customers, sales, inventory,
              payments and reports from one platform.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-4">

              <Link
                href="/register"
                className="rounded-xl bg-sky-500 px-7 py-3.5 font-semibold text-white shadow-sm transition hover:bg-sky-600"
              >
                Get Started
              </Link>

              <Link
                href="/login"
                className="rounded-xl border border-sky-200 bg-white px-7 py-3.5 font-semibold text-sky-600 transition hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900 dark:text-sky-400 dark:hover:bg-slate-800"
              >
                Sign In
              </Link>

            </div>

          </div>

        </div>
      </section>

      {/* About */}
      <section className="bg-white py-20 dark:bg-slate-950">

        <div className="mx-auto max-w-7xl px-6">

          <div className="grid items-center gap-12 lg:grid-cols-2">

            <div>

              <p className="text-sm font-semibold uppercase tracking-wider text-sky-500">
                Our Platform
              </p>

              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                A smarter way to manage your business
              </h2>

              <p className="mt-5 leading-8 text-slate-600 dark:text-slate-400">
                Managing a business involves many daily activities.
                Products, customers, sales, payments and inventory
                all need to be organized and monitored.
              </p>

              <p className="mt-4 leading-8 text-slate-600 dark:text-slate-400">
                ShanBizFlow brings these operations together into
                one modern management system, helping businesses
                keep their information organized and accessible.
              </p>

            </div>

            <div className="grid grid-cols-2 gap-5">

              <div className="rounded-3xl border border-sky-100 bg-sky-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="text-3xl">⚡</div>

                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                  Simple
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Clean and easy-to-use business management interface.
                </p>
              </div>

              <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="text-3xl">🔒</div>

                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                  Secure
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Protected accounts with secure authentication.
                </p>
              </div>

              <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="text-3xl">📊</div>

                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                  Data Driven
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Useful business information and performance reports.
                </p>
              </div>

              <div className="rounded-3xl border border-sky-100 bg-sky-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="text-3xl">📱</div>

                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                  Responsive
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Designed for desktop, tablet and mobile screens.
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* Features */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900">

        <div className="mx-auto max-w-7xl px-6">

          <div className="mx-auto max-w-2xl text-center">

            <p className="text-sm font-semibold uppercase tracking-wider text-sky-500">
              Features
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Everything in one platform
            </h2>

            <p className="mt-4 leading-7 text-slate-500 dark:text-slate-400">
              Manage the important parts of your business from
              one centralized system.
            </p>

          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-sky-100 bg-white p-7 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-xl dark:bg-sky-950">
                  {feature.icon}
                </div>

                <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
                  {feature.title}
                </h3>

                <p className="mt-2 leading-7 text-slate-500 dark:text-slate-400">
                  {feature.description}
                </p>

              </div>
            ))}

          </div>

        </div>

      </section>

      {/* How It Works */}
      <section className="bg-white py-20 dark:bg-slate-950">

        <div className="mx-auto max-w-7xl px-6">

          <div className="mx-auto max-w-3xl text-center">

            <p className="text-sm font-semibold uppercase tracking-wider text-sky-500">
              How It Works
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Manage your business in four simple steps
            </h2>

          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-4">

            {[
              {
                number: "01",
                title: "Add Products",
                text: "Create your product catalog and manage stock.",
              },
              {
                number: "02",
                title: "Add Customers",
                text: "Store and manage your customer information.",
              },
              {
                number: "03",
                title: "Record Sales",
                text: "Create sales and track customer payments.",
              },
              {
                number: "04",
                title: "View Reports",
                text: "Understand your business performance.",
              },
            ].map((step) => (
              <div
                key={step.number}
                className="text-center"
              >

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-lg font-bold text-white">
                  {step.number}
                </div>

                <h3 className="mt-5 font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {step.text}
                </p>

              </div>
            ))}

          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="bg-sky-500 py-16">

        <div className="mx-auto max-w-4xl px-6 text-center">

          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to manage your business smarter?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-sky-100">
            Start organizing your products, customers, sales,
            inventory and reports with ShanBizFlow.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-flex rounded-xl bg-white px-7 py-3.5 font-semibold text-sky-600 shadow-sm transition hover:bg-sky-50"
          >
            Create Your Account
          </Link>

        </div>

      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-8 dark:border-slate-800 dark:bg-slate-950">

        <div className="mx-auto max-w-7xl px-6 text-center">

          <p className="font-bold text-sky-600">
            ShanBizFlow
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Business Management System
          </p>

        </div>

      </footer>

    </main>
  );
}