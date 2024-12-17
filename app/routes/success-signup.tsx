import image from "../foto/confirmed-concept-illustration 1.png";
import { Navigate } from "@remix-run/react";

const SuccessSignUpPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center p-4">
        <img src={image} alt="Illustration" className="mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Verifikasi Berhasil</h1>
        <p className="text-gray-700 mb-6">
          Selamat E-mail kamu sudah berhasil terverifikasi. Klik tombol di bawah
          ini untuk langkah selanjutnya
        </p>
        <button
        className="w-full bg-yellow-300 text-black py-2 px-4 rounded shadow-md hover:shadow-lg font-bold"
        onClick={() => <Navigate to="/" />}
        >
          Masuk ke Akun Anda
        </button>
      </div>
    </div>
  );
};

export default SuccessSignUpPage;