type WelcomeMessageProps = {
  name: string;
};

export default function WelcomeMessage({ name }: WelcomeMessageProps) {
  return (
    <div className="mt-8 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">
        Welcome, {name}
      </h2>

      <p className="mt-2 text-slate-600">
        Manage your business easily with ShanBizFlow.
      </p>
    </div>
  );
}