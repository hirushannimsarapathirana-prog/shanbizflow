import Button from "@/components/Button";
import DashboardPreview from "@/components/DashboardPreview";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-sky-50">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-3xl">
            <span className="inline-block rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-600">
              Smart Business Management
            </span>

            <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
              Manage your business
              <span className="text-sky-500"> smarter.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              ShanBizFlow helps you manage products, customers, sales,
              inventory and business reports from one simple platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button text="Get Started" />

              <button className="rounded-xl border border-sky-200 bg-white px-6 py-3 font-semibold text-sky-600 transition hover:bg-sky-50">
                Learn More
              </button>
            </div>
          </div>

          <DashboardPreview />
        </div>
      </section>
    </main>
  );
}