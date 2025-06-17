import { useState } from "react";
import { useNavigate, useLoaderData, useNavigation } from "@remix-run/react";
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import {
  SpinningLoader,
  LoadingOverlay,
} from "../routes/components/SpinningLoader";

const prisma = new PrismaClient();

// Type definitions
interface ProductImage {
  id: string;
  url: string;
  productId: string;
}

interface Product {
  id: string;
  name: string;
  size: string;
  price: number;
  stock: number;
  images: ProductImage[];
  updatedAt: string; // Tambahkan field updatedAt
  createdAt: string; // Tambahkan field createdAt
}

interface LoaderData {
  products: Product[];
}

// Loader untuk mengambil data produk dengan sorting berdasarkan updatedAt
export const loader = async () => {
  const products = await prisma.product.findMany({
    include: { images: true },
    orderBy: [
      { updatedAt: "desc" }, // Urutkan berdasarkan updatedAt terbaru
      { createdAt: "desc" }, // Fallback ke createdAt jika updatedAt sama
    ],
  });
  return json({ products });
};

// Action untuk menghapus data produk
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const productId = formData.get("productId") as string;

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

    product.images.forEach((image: ProductImage) => {
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
  const navigation = useNavigation();
  const { products } = useLoaderData<LoaderData>();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});

  // Check if page is loading
  const isPageLoading = navigation.state === "loading";
  const isSubmitting = navigation.state === "submitting";

  const setLoading = (id: string, isLoading: boolean) => {
    setLoadingStates((prev) => ({
      ...prev,
      [id]: isLoading,
    }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleDelete = async () => {
    if (!selectedProductId) return;

    setLoading(`delete-${selectedProductId}`, true);

    try {
      const response = await fetch("/admin/productslist", {
        method: "POST",
        body: new URLSearchParams({ productId: selectedProductId }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert("Gagal menghapus produk.");
      }
    } catch (error) {
      alert("Terjadi kesalahan saat menghapus produk");
      console.error(error);
    } finally {
      setLoading(`delete-${selectedProductId}`, false);
      setShowModal(false);
      setSelectedProductId(null);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Filter produk berdasarkan search term, tetap mempertahankan urutan dari database
  const filteredProducts = products.filter((product: Product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fungsi untuk format tanggal
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fungsi untuk menentukan apakah produk baru diupdate (dalam 24 jam terakhir)
  const isRecentlyUpdated = (updatedAt: string, createdAt: string) => {
    const updated = new Date(updatedAt);
    const created = new Date(createdAt);
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Produk dianggap baru diupdate jika updatedAt lebih baru dari createdAt
    // dan updatedAt dalam 24 jam terakhir
    return updated > created && updated > oneDayAgo;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Loading Overlay untuk page loading */}
      <LoadingOverlay
        isVisible={isPageLoading}
        text="Memuat halaman..."
        blur={true}
      />

      <header className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400 shadow-xl backdrop-blur-sm">
        <div className="p-6 relative flex justify-center items-center">
          <button
            className="absolute left-6 text-yellow-900 bg-white/30 backdrop-blur-sm w-12 h-12 rounded-xl flex items-center justify-center hover:bg-white/40 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
            onClick={() => handleNavigation("/admin-menu")}
            disabled={isPageLoading || isSubmitting}
          >
            {isPageLoading ? (
              <SpinningLoader size="small" color="yellow" />
            ) : (
              <i className="fas fa-arrow-left text-lg"></i>
            )}
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-yellow-900 mb-1">
              ThriftEase Admin
            </h1>
          </div>
        </div>
      </header>

      <div className="bg-gray-200 p-4 rounded-md relative flex justify-center items-center mb-4">
        <h2 className="text-lg font-semibold text-center w-full">Produk</h2>
        <button
          className="absolute right-4 bg-yellow-300 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-yellow-400 transition-colors duration-200 disabled:opacity-50"
          onClick={() => handleNavigation("/admin/products")}
          disabled={isPageLoading || isSubmitting}
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
            disabled={isPageLoading || isSubmitting}
          />
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>

        {/* Info sorting */}

        {filteredProducts.map((product: Product) => (
          <div
            key={product.id}
            className={`bg-white p-4 rounded-md shadow-md flex items-start mb-4 relative ${
              isRecentlyUpdated(product.updatedAt, product.createdAt)
                ? "border-l-4 border-green-500"
                : ""
            }`}
          >
            {/* Badge untuk produk yang baru diupdate */}
            {isRecentlyUpdated(product.updatedAt, product.createdAt) && (
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Baru Diupdate
              </div>
            )}

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

              {/* Informasi tanggal update */}
              <div className="text-xs text-gray-400 mt-1">
                Diupdate: {formatDate(product.updatedAt)}
              </div>

              <div className="text-end">
                <p className="text-sm text-gray-500 mb-2">
                  Stok: {product.stock}
                </p>
              </div>
              <div className="flex justify-end mt-6 space-x-2">
                <button
                  className="bg-yellow-300 text-gray-800 font-semibold py-1 px-4 rounded-lg text-[10px] lg:text-sm hover:bg-yellow-400 transition-colors duration-200 disabled:opacity-50"
                  onClick={() =>
                    handleNavigation(`/admin/productsedit?id=${product.id}`)
                  }
                  disabled={isPageLoading || isSubmitting}
                >
                  Ubah
                </button>
                <button
                  className="bg-red-400 text-gray-800 font-semibold py-1 px-4 rounded-lg text-[10px] lg:text-sm hover:bg-red-500 transition-colors duration-200 disabled:opacity-50"
                  onClick={() => {
                    setSelectedProductId(product.id);
                    setShowModal(true);
                  }}
                  disabled={isPageLoading || isSubmitting}
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm
              ? "Tidak ada produk yang sesuai dengan pencarian"
              : "Belum ada produk"}
          </div>
        )}
      </main>

      {/* Modal Konfirmasi Hapus */}
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
                className="bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200 disabled:opacity-50"
                onClick={() => setShowModal(false)}
                disabled={loadingStates[`delete-${selectedProductId}`]}
              >
                Batal
              </button>
              <button
                className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2 min-w-[80px] justify-center"
                onClick={handleDelete}
                disabled={loadingStates[`delete-${selectedProductId}`]}
              >
                {loadingStates[`delete-${selectedProductId}`] ? (
                  <>
                    <SpinningLoader size="small" color="white" />
                    <span>...</span>
                  </>
                ) : (
                  <span>Hapus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KelolaProdukPage;
