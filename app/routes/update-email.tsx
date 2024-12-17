import React, { useState } from "react";
import { useSearchParams, useLoaderData } from "@remix-run/react";

const ResetEmailPage = () => {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // Fungsi validasi email menggunakan regex
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("Format email tidak valid");
      return;
    }

    setError(null);

    try {
      const response = await fetch("/api/update-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email }),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const errorResponse = await response.json();
        setError(errorResponse.error || "Error updating email");
      }
    } catch (error) {
      console.error("Error updating email:", error);
      setError("Terjadi kesalahan, silakan coba lagi.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="bg-white p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Ganti Email</h1>
        <p className="text-gray-600 mb-6">
          Silakan masukkan email baru Anda di bawah ini. Pastikan email anda aktif.
        </p>
        {success && (<p className="text-green-500 mb-4">Email berhasil diubah.</p>)}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form method="post" onSubmit={handleSubmit}>
          <input type="hidden" name="token" value={token} />
          <input
            type="email"
            name="email"
            placeholder="Masukkan email"
            className="w-full p-3 border border-gray-300 rounded mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full p-3 bg-yellow-300 text-black font-bold rounded shadow-md hover:bg-yellow-400"
          >
            Kirim
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetEmailPage;