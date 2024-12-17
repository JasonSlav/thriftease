import { Form } from "@remix-run/react";
import { redirect } from "@remix-run/node"; // Untuk redirect di server
import { useNavigate } from "@remix-run/react"; // Untuk navigasi klien

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "logout") {
    return redirect("/logout"); // Mengarahkan ke logout handler
  }

  return null;
};

export default function MenuAdminPage() {
  const navigate = useNavigate(); // Untuk navigasi sisi klien

  return (
    <div className="flex flex-col items-center min-h-screen bg-white">
      {/* Header dengan ikon user */}
      <div className="w-full bg-yellow-300 p-6 flex flex-col items-center">
        <div className="bg-gray-300 w-14 h-14 rounded-full flex items-center justify-center">
          <i className="fas fa-user-circle text-6xl text-white"></i>
        </div>
        <div className="flex justify-center w-full mt-2">
          <span className="text-xl font-bold text-center">Admin 123</span>
        </div>
      </div>

      {/* Tombol Navigasi */}
      <div className="w-full flex flex-col items-center space-y-4 mt-16 relative">
        <button
          onClick={() => navigate("/admin-dashboard")}
          className="w-11/12 relative p-4 bg-white rounded-lg shadow-md border border-black flex items-center justify-center"
        >
          <span className="text-lg font-semibold">Dashboard</span>
          <div className="absolute right-4 w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center">
            <i className="fas fa-chevron-right text-black"></i>
          </div>
        </button>

        <button
          onClick={() => navigate("/admin-pesanan")}
          className="w-11/12 relative p-4 bg-white rounded-lg shadow-md border border-black flex items-center justify-center"
        >
          <span className="text-lg font-semibold">Pesanan</span>
          <div className="absolute right-4 w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center">
            <i className="fas fa-chevron-right text-black"></i>
          </div>
        </button>

        <button
          onClick={() => navigate("/admin-transaksi")}
          className="w-11/12 relative p-4 bg-white rounded-lg shadow-md border border-black flex items-center justify-center"
        >
          <span className="text-lg font-semibold">Transaksi</span>
          <div className="absolute right-4 w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center">
            <i className="fas fa-chevron-right text-black"></i>
          </div>
        </button>

        <button
          onClick={() => navigate("/admin/productslist")}
          className="w-11/12 relative p-4 bg-white rounded-lg shadow-md border border-black flex items-center justify-center"
        >
          <span className="text-lg font-semibold">Kelola Produk</span>
          <div className="absolute right-4 w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center">
            <i className="fas fa-chevron-right text-black"></i>
          </div>
        </button>
        <button
          onClick={() => navigate("/admin/login")}
          className="w-11/12 relative p-4 bg-yellow-300 rounded-lg shadow-md border border-black flex items-center justify-center"
        >
          <span className="text-lg font-semibold">Log Out</span>
        </button>
      </div>
    </div>
  );
}
