import WelcomeMessage from "@/components/WelcomeMessage";
import Button from "@/components/Button";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-5xl font-extrabold text-green-600">
        ShanBizFlow
      </h1>

      <WelcomeMessage name="Hirushan" />

      <div className="mt-6">
        <Button text="Get Started" />
      </div>
    </main>
  );
}