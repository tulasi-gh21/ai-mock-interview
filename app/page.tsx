"use client";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold mb-6">
        AI Mock Interview Platform
      </h1>

      <p className="text-xl mb-8">
        Practice interviews with AI and improve your skills.
      </p>

      <button
        onClick={() => {
          window.location.href = "/login";
        }}
        className="bg-white text-black px-6 py-3 rounded-lg font-semibold"
      >
        Login
      </button>
    </main>
  );
}