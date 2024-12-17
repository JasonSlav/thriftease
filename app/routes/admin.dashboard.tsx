import { useNavigate } from "@remix-run/react"; // Import useNavigate

const MenuAdminPage = () => {
  const navigate = useNavigate(); // Initialize useNavigate

  return (
    <div className="flex flex-col items-center min-h-screen bg-white">
      {/* Header dengan ikon user */}
      <div className="w-full bg-yellow-300 p-6 flex flex-col items-center">
        <div className="bg-gray-300 w-14 h-14 rounded-full flex items-center justify-center">
          <i className="fas fa-user-circle text-6xl text-white"></i>
        </div>
        {/* Nama Admin (centered) */}
        <div className="flex justify-center w-full mt-2">
          <span className="text-xl font-bold text-center">Admin</span>
        </div>
      </div>

      {/* Daftar tombol dengan teks benar-benar di tengah dan arrow tetap berada di kanan */}
      <div className="w-full flex flex-col items-center space-y-4 mt-16 relative">
        {/* Tombol Dashboard */}
        <button className="w-11/12 relative p-4 bg-white rounded-lg shadow-md border border-black flex items-center justify-center"          onClick={() => navigate("/dashboard")} 
        >
          <span className="text-lg font-semibold">Dashboard</span>
          <div className="absolute right-4 w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center">
            <i className="fas fa-chevron-right text-black"></i>
          </div>
        </button>

        {/* Tombol Pesanan */}
        <button className="w-11/12 relative p-4 bg-white rounded-lg shadow-md border border-black flex items-center justify-center">
          <span className="text-lg font-semibold">Pesanan</span>
          <div className="absolute right-4 w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center">
            <i className="fas fa-chevron-right text-black"></i>
          </div>
        </button>

        {/* Tombol Transaksi */}
        <button className="w-11/12 relative p-4 bg-white rounded-lg shadow-md border border-black flex items-center justify-center">
          <span className="text-lg font-semibold">Transaksi</span>
          <div className="absolute right-4 w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center">
            <i className="fas fa-chevron-right text-black"></i>
          </div>
        </button>

        {/* Tombol Kelola Produk */}
        <button 
        className="w-11/12 relative p-4 bg-white rounded-lg shadow-md border border-black flex items-center justify-center"
        onClick={() => navigate("/admin/productslist")}
        >
          <span className="text-lg font-semibold">Kelola Produk</span>
          <div className="absolute right-4 w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center">
            <i className="fas fa-chevron-right text-black"></i>
          </div>
        </button>

        {/* Tombol Log Out */}
        <button className="w-11/12 p-4 bg-yellow-300 rounded-lg shadow-md border text-black font-bold border-black text-center" onClick={() => navigate("/loginadmin")}>
          Log Out
        </button>
      </div>
    </div>
  );
};

export default MenuAdminPage;