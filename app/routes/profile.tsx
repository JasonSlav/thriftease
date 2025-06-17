import { useState } from "react";
import { useNavigate, Form, useLoaderData } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import { authenticator } from "~/utils/auth.server";

const prisma = new PrismaClient();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return redirect("/login");
  }

  const userDetails = await prisma.user.findUnique({
    where: { id: user.id },
    select: { username: true }, // Ambil hanya kolom name
  });

  if (!userDetails) {
    throw new Error("User tidak ditemukan di database.");
  }

  return { user, name: userDetails.username };
};

type LoaderData = {
  name: string;
};

const ProfilePage = () => {
  const { name } = useLoaderData<LoaderData>();
  const navigate = useNavigate(); // Initialize useNavigate
  const [showLogoutPopup, setShowLogoutPopup] = useState(false); // State untuk popup logout

  const handleLogout = () => {
    setShowLogoutPopup(true); // Tampilkan popup saat tombol logout ditekan
  };

  const confirmLogout = () => {
    // Tambahkan logika logout di sini, misalnya menghapus token auth
    navigate("/"); // Redirect ke halaman login setelah logout
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-white">
      <div className="w-full bg-yellow-300 p-6 flex flex-col items-center">
        <button
          className="bg-gray-300 w-14 h-14 rounded-full flex items-center justify-center"
          onClick={() => navigate("/account")}
        >
          <i className="fas fa-user-circle text-6xl text-white"></i>
        </button>
        <button
          className="flex items-center mt-2"
          onClick={() => navigate("/account")}
        >
          <span className="text-xl font-bold">{name}</span>
          <i className="fas fa-pencil-alt ml-2 text-black"></i>
        </button>
      </div>
      <div className="w-full flex flex-col items-center space-y-4 mt-16">
        <button
          className="w-11/12 flex items-center justify-between p-4 bg-white rounded-lg shadow-md border border-black"
          onClick={() => navigate("/riwayat-pesanan")} // Navigate to /riwayatpesanan
        >
          <div className="flex items-center">
            <div className="w-8 flex justify-center">
              <i className="fas fa-history text-2xl text-black"></i>
            </div>
            <span className="ml-4 text-lg font-semibold">Pesanan Saya</span>
          </div>
          <div className="w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center">
            <i className="fas fa-chevron-right text-black"></i>
          </div>
        </button>
        <button
          className="w-11/12 flex items-center justify-between p-4 bg-white rounded-lg shadow-md border border-black"
          onClick={() => navigate("/riwayat-transaksi")} // Navigate to /riwayattransaksi
        >
          <div className="flex items-center">
            <div className="w-8 flex justify-center">
              <i className="fas fa-receipt text-2xl text-black"></i>
            </div>
            <span className="ml-4 text-lg font-semibold">
              Riwayat Transaksi
            </span>
          </div>
          <div className="w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center">
            <i className="fas fa-chevron-right text-black"></i>
          </div>
        </button>
        <button
          className="w-11/12 flex items-center justify-between p-4 bg-white rounded-lg shadow-md border border-black"
          onClick={() => navigate("/tentangkami")} // Navigate to /tentangkami
        >
          <div className="flex items-center">
            <div className="w-8 flex justify-center">
              <i className="fas fa-question-circle text-2xl text-black"></i>
            </div>
            <span className="ml-4 text-lg font-semibold">Tentang Kami</span>
          </div>
          <div className="w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center">
            <i className="fas fa-chevron-right text-black"></i>
          </div>
        </button>
        <button
          className="w-11/12 p-4 bg-white rounded-lg shadow-md border text-yellow-300 font-bold border-black text-outline"
          onClick={() => navigate("/change-password")} // Navigate to /changepassword
        >
          Ganti Password
        </button>
        <button
          className="w-11/12 p-4 bg-yellow-300 rounded-lg shadow-md border text-black font-bold border-black mb-important"
          onClick={handleLogout} // Tampilkan popup saat logout ditekan
        >
          Log Out
        </button>
      </div>
      <footer className="bottom-0 w-full bg-yellow-300 p-4 flex justify-around items-center z-10 sticky">
        <div
          className="flex flex-col items-center cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/")} // Navigate to /home
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/");
            }
          }}
        >
          <i className="fas fa-home text-2xl text-white"></i>
          <span className="text-white text-sm font-bold">Beranda</span>
        </div>
        <div
          className="flex flex-col items-center cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/cart")} // Navigate to /keranjang
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/cart");
            }
          }}
        >
          <i className="fas fa-shopping-cart text-2xl text-white"></i>
          <span className="text-white text-sm font-bold">Keranjang</span>
        </div>
        <div
          className="flex flex-col items-center cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/profile")} // Navigate to /profile
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/profile");
            }
          }}
        >
          <i className="fas fa-user text-2xl text-white"></i>
          <span className="text-white text-sm font-bold">Saya</span>
        </div>
      </footer>

      {/* Popup Logout */}
      {showLogoutPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg border-2 border-yellow-300 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-300 w-10 h-10 flex items-center justify-center rounded-full">
                <span className="text-2xl font-bold text-black">!</span>
              </div>
            </div>
            <p className="text-lg font-semibold mb-6">
              Apakah yakin ingin log out?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                className="bg-yellow-300 text-black px-6 py-2 rounded font-bold"
                onClick={() => setShowLogoutPopup(false)} // Tutup popup
              >
                Tidak
              </button>
              <Form method="post" action="/logout">
                <button
                  className="border border-black px-6 py-2 rounded font-bold text-black"
                  onClick={confirmLogout} // Lakukan logout
                >
                  Iya
                </button>
              </Form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
