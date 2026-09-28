import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";

type UserPayload = {
  userId: number;
  email: string;
  role: string;
};

export default async function DashboardPage() {
  const cookieStore = await cookies();

  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET
    );

    const { payload } = await jwtVerify(token, secret);

    const user = payload as unknown as UserPayload;

    return (
      <main className="min-h-screen bg-sky-50 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-sky-100 bg-white p-8 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-sky-500">
                Dashboard
              </p>

              <h1 className="mt-2 text-4xl font-bold text-slate-900">
                Welcome to ShanBizFlow
              </h1>

              <p className="mt-3 text-slate-500">
                Manage your business from one place.
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl bg-sky-50 p-6">
                <p className="text-sm text-slate-500">
                  Email
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {user.email}
                </p>
              </div>

              <div className="rounded-2xl bg-sky-50 p-6">
                <p className="text-sm text-slate-500">
                  Role
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {user.role}
                </p>
              </div>

              <div className="rounded-2xl bg-sky-50 p-6">
                <p className="text-sm text-slate-500">
                  User ID
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {user.userId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error("Dashboard authentication failed:", error);

    redirect("/login");
  }
}