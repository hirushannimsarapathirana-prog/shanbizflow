import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";

type UserPayload = {
  userId: number;
  email: string;
  role: string;
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let user: UserPayload | null = null;

  if (token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET
      );

      const { payload } = await jwtVerify(token, secret);

      user = {
        userId: Number(payload.userId),
        email: String(payload.email),
        role: String(payload.role),
      };
    } catch (error) {
      console.error("Dashboard authentication failed:", error);
    }
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-7xl">

          <div className="mb-8">
            <p className="text-sm font-semibold text-sky-500">
              Dashboard
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
              Welcome back 👋
            </h1>

            <p className="mt-2 text-slate-500">
              Here is what's happening with your business today.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total Sales
              </p>

              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                $24,580
              </h2>

              <p className="mt-2 text-sm font-medium text-sky-600">
                +12.5% this month
              </p>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Orders
              </p>

              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                1,248
              </h2>

              <p className="mt-2 text-sm font-medium text-sky-600">
                +8.2% this month
              </p>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Customers
              </p>

              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                856
              </h2>

              <p className="mt-2 text-sm font-medium text-sky-600">
                +5.4% this month
              </p>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Products
              </p>

              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                342
              </h2>

              <p className="mt-2 text-sm font-medium text-sky-600">
                18 low in stock
              </p>
            </div>

          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">

            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Recent Sales
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Latest business transactions
                  </p>
                </div>

                <button className="text-sm font-semibold text-sky-600 hover:text-sky-700">
                  View All
                </button>

              </div>

              <div className="mt-6 space-y-4">

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      INV-1001
                    </p>

                    <p className="text-sm text-slate-500">
                      John Perera
                    </p>
                  </div>

                  <p className="font-semibold text-slate-900">
                    $1,250
                  </p>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      INV-1002
                    </p>

                    <p className="text-sm text-slate-500">
                      Kasun Silva
                    </p>
                  </div>

                  <p className="font-semibold text-slate-900">
                    $850
                  </p>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      INV-1003
                    </p>

                    <p className="text-sm text-slate-500">
                      Nimal Fernando
                    </p>
                  </div>

                  <p className="font-semibold text-slate-900">
                    $2,100
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      INV-1004
                    </p>

                    <p className="text-sm text-slate-500">
                      Amal Perera
                    </p>
                  </div>

                  <p className="font-semibold text-slate-900">
                    $540
                  </p>
                </div>

              </div>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                Quick Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your account information
              </p>

              <div className="mt-6 space-y-5">

                <div>
                  <p className="text-sm text-slate-500">
                    Email
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {user.email}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Role
                  </p>

                  <p className="mt-1 inline-block rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-600">
                    {user.role}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    User ID
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    #{user.userId}
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}