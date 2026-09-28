export default function DashboardPreview() {
  return (
    <div className="mt-16 rounded-3xl border border-sky-100 bg-white p-4 shadow-xl shadow-sky-100/50">
      <div className="rounded-2xl bg-sky-50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Dashboard</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Business Overview
            </h2>
          </div>

          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-sky-600 shadow-sm">
            This Month
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Sales</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              $24,580
            </p>
            <p className="mt-2 text-sm font-medium text-sky-600">
              +12.5% this month
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Orders</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              1,248
            </p>
            <p className="mt-2 text-sm font-medium text-sky-600">
              +8.2% this month
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Customers</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              856
            </p>
            <p className="mt-2 text-sm font-medium text-sky-600">
              +5.4% this month
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Recent Activity
          </p>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-700">
                New order received
              </span>
              <span className="text-sm text-sky-600">
                Just now
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-700">
                New customer registered
              </span>
              <span className="text-sm text-slate-400">
                10 min ago
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">
                Product stock updated
              </span>
              <span className="text-sm text-slate-400">
                25 min ago
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}