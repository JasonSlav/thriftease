import { useState } from "react";
import { useNavigate, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

// Loader untuk mengambil data produk
export const loader = async () => {
  const products = await prisma.product.findMany({
    include: { images: true },
  });
  return json({ products });
};

// Action untuk menghapus data produk
export const action = async ({ request }) => {
  const formData = await request.formData();
  const productId = formData.get("productId");

  if (!productId) {
    return json({ error: "Product ID is required" }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) {
      return json({ error: "Product not found" }, { status: 404 });
    }

    product.images.forEach((image) => {
      const filePath = `./public/uploads/${image.url.split("/").pop()}`;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await prisma.product.delete({
      where: { id: productId },
    });

    return json({ success: true });
  } catch (error) {
    console.error(error);
    return json({ error: "Failed to delete product" }, { status: 500 });
  }
};

// Komponen utama
const KelolaProdukPage = () => {
  const navigate = useNavigate();
  const { products } = useLoaderData();
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleDelete = async () => {
    if (!selectedProductId) return;

    const response = await fetch("/admin/productslist", {
      method: "POST",
      body: new URLSearchParams({ productId: selectedProductId }),
    });

    if (response.ok) {
      window.location.reload();
    } else {
      alert("Gagal menghapus produk.");
    }

    setShowModal(false);
    setSelectedProductId(null);
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md p-4 relative flex justify-center items-center">
        <button
          className="absolute left-4 text-2xl text-black bg-yellow-300 w-10 h-10 rounded-full"
          onClick={() => navigate("/admin-menu")}
        >
          <i className="fas fa-bars"></i>
        </button>
        <h1 className="text-xl font-bold text-center">ThriftEase Admin</h1>
      </header>

      <div className="bg-gray-200 p-4 rounded-md relative flex justify-center items-center mb-4">
        <h2 className="text-lg font-semibold text-center w-full">Produk</h2>
        <button
          className="absolute right-4 bg-yellow-300 text-white w-10 h-10 rounded-full flex items-center justify-center"
          onClick={() => navigate("/admin/products")}
        >
          <i className="fas fa-plus"></i>
        </button>
      </div>

      <main className="p-4">
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full p-2 pl-10 rounded-md border border-gray-300 focus:outline-none focus:border-yellow-300"
          />
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>

        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white p-4 rounded-md shadow-md flex items-start mb-4"
          >
            <img
              src={product.images[0]?.url || "https://placehold.co/100x100"}
              alt={product.name}
              className="w-24 h-24 object-cover rounded-md mr-4"
            />
            <div className="flex-1">
              <h3 className="text-sm font-semibold">{product.name}</h3>
              <p className="text-sm text-gray-500">Size: {product.size}</p>
              <p className="text-lg font-bold text-yellow-300">
                Rp {product.price.toLocaleString()}
              </p>
              <div className="text-end">
                <p className="text-sm text-gray-500 mb-2">
                  Stok: {product.stock}
                </p>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  className="bg-yellow-300 text-gray-800 font-semibold py-1 px-4 rounded-lg text-[10px] lg:text-sm mr-2"
                  onClick={() => navigate(`/admin/productsedit?id=${product.id}`)}
                >
                  Ubah
                </button>
                <button
                  className="bg-red-400 text-gray-800 font-semibold py-1 px-4 rounded-lg text-[10px] lg:text-sm"
                  onClick={() => {
                    setSelectedProductId(product.id);
                    setShowModal(true);
                  }}
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-bold mb-4">Konfirmasi Penghapusan</h2>
            <p className="text-sm text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak
              dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                onClick={() => setShowModal(false)}
              >
                Batal
              </button>
              <button
                className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg"
                onClick={handleDelete}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KelolaProdukPage;
