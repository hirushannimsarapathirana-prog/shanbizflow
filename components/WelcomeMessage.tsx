type WelcomeMessageProps = {
  name: string;
};

export default function WelcomeMessage({ name }: WelcomeMessageProps) {
  return (
    <div className="mt-8 rounded-xl bg-white p-6 shadow-md">
      <h2 className="text-2xl font-semibold text-gray-900">
        Welcome, {name}
      </h2>

      <p className="mt-2 text-gray-600">
        Manage your business easily.
      </p>
    </div>
  );
}