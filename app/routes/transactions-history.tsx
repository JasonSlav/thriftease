import { useNavigate } from "@remix-run/react"; // Import useNavigate

function RiwayatTransaksiPage() {
  const navigate = useNavigate(); // Initialize useNavigate

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="relative flex items-center justify-between border-b pb-2 lg:pb-4 mb-4 lg:mb-6 w-full px-4 lg:px-8 bg-white pt-4">
        <button
          onClick={() => navigate(-1)} // Navigate ke halaman sebelumnya
          className="w-8 h-8 lg:w-10 lg:h-10 bg-yellow-300 rounded-full flex items-center justify-center"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-xl lg:text-2xl font-bold">
          Riwayat Transaksi
        </h1>
      </header>
      <div className="bg-white rounded-lg shadow-xl p-4 lg:p-6 mb-4 lg:mb-6 border border-black ml-4 mr-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
            <i className="fas fa-money-bill text-white text-2xl"></i>
          </div>
          <div className="ml-4 flex-grow">
            <h2 className="text-lg font-bold text-gray-800">Pembayaran</h2>
            <p className="text-gray-500">Gopay</p>
            <p className="text-gray-500 mt-1">22 September 2024</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-800">Rp. 109.000</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RiwayatTransaksiPage;