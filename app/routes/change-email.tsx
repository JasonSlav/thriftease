import { useState } from "react";
import { useNavigate } from "@remix-run/react";
import image from "../foto/rb_287 1.png";

const GantiEmailPage = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch("/api/change-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({ email }),
            });

            const result = await response.json();

            if (response.ok) {
                setMessage(result.message);
                setTimeout(() => {
                    navigate("/success-gantiemail");
                }, 3000);
            } else {
                setError(result.error);
            }
        } catch (error) {
            setError("Terjadi kesalahan, silakan coba lagi.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <form onSubmit={handleSubmit} className="bg-white p-6 text-center">
                <h1 className="text-2xl font-bold mb-4">Ganti Email</h1>
                <img src={image} alt="Illustration" className="mx-auto mb-4" />
                <p className="text-gray-600 mb-6">
                    Masukkan email lama akun Anda, kami akan mengirimkan link untuk
                    verifikasi ganti email
                </p>
                <input
                    type="email"
                    placeholder="Masukkan email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded mb-4"
                />
                <button className="w-full p-3 bg-yellow-300 text-black font-bold rounded shadow-md hover:bg-yellow-400">
                    Kirim
                </button>

                {message && <p className="mt-4 text-green-500">{message}</p>}
                {error && <p className="mt-4 text-red-500">{error}</p>}
            </form>
        </div>
    );
};

export default GantiEmailPage;