"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase";

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setUserEmail(user.email || "");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">
          Checking authentication...
        </h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">
            Recent Interview Reports
          </h1>

          <p className="mt-2 text-gray-600">
            Logged in as: {userEmail}
          </p>
        </div>

        <button
          onClick={async () => {
            await auth.signOut();
            router.push("/login");
          }}
          className="bg-black text-white px-5 py-3 rounded-lg"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold">
            Interviews Attended
          </h2>

          <p className="text-3xl font-bold mt-2">
            12
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold">
            Average Score
          </h2>

          <p className="text-3xl font-bold mt-2">
            8.5/10
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold">
            Highest Score
          </h2>

          <p className="text-3xl font-bold mt-2">
            9.8/10
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-2xl font-bold mb-3">
          Performance
        </h2>

        <p className="text-xl font-semibold mb-3">
          Excellent
        </p>

        <h2 className="text-2xl font-bold mb-3">
          Improvement Feedback
        </h2>

        <p className="text-gray-700">
          Improve confidence and communication while answering technical questions.
        </p>
      </div>

      <button
        onClick={() => {
          window.location.href = "/interview";
        }}
        className="bg-black text-white px-6 py-3 rounded-lg"
      >
        Start Interview
      </button>
    </main>
  );
}