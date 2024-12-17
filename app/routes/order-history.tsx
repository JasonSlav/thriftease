import { useNavigate } from "@remix-run/react"; // Import useNavigate

function RiwayatPesananPage() {
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
          Riwayat Pesanan
        </h1>
      </header>
      <div className="bg-white rounded-lg shadow-xl p-4 lg:p-6 mb-4 lg:mb-6 border border-black ml-4 mr-4">
        <div className="flex">
          <img
            src="https://placehold.co/100x100"
            alt="Jaket Tracktop Vintage Putih Petrol Salvio"
            className="w-24 h-24 lg:w-32 lg:h-32 object-cover rounded-md"
          />
          <div className="ml-4 lg:ml-6 flex-grow">
            <h2 className="text-gray-800 font-semibold text-[10px] lg:text-sm">
              Ra Cloth Jaket Tracktop Vintage Putih Petrol Salvio Hexia Jaket
              Parasut Sport
            </h2>
            <p className="text-gray-600 mt-1 text-[8px] lg:text-xs">
              Size : XL
            </p>
            <p className="text-gray-800 font-bold mt-2 lg:mt-3 text-[10px] lg:text-sm">
              Rp 100.000
            </p>
          </div>
          <div className="flex items-end">
            <span className="text-gray-600 text-[8px] lg:text-xs">x1</span>
          </div>
        </div>

        <hr className="my-4 lg:my-6 border-black" />

        <div className="flex justify-between items-center">
          <span className="text-gray-800 font-semibold text-[12px] lg:text-lg">
            Total Pesanan (1 Produk):
          </span>
          <span className="text-yellow-500 font-bold text-[12px] lg:text-lg">
            Rp 100.000
          </span>
        </div>

        <hr className="my-4 lg:my-6 border-black" />

        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-800 font-semibold text-[12px] lg:text-lg">
            Status Pesanan
          </span>
          <span className="text-gray-800 font-bold text-[12px] lg:text-lg">
            Selesai
          </span>
        </div>

        <div className="flex justify-end">
          <button className="bg-gray-300 text-gray-800 font-semibold py-1 px-4 rounded-lg text-[10px] lg:text-sm mr-2">
            Hubungi Penjual
          </button>
          <button className="bg-yellow-300 text-gray-800 font-semibold py-1 px-4 rounded-lg text-[10px] lg:text-sm">
            Beli Lagi
          </button>
        </div>
      </div>
    </div>
  );
}

export default RiwayatPesananPage;