import { useState, useEffect, useRef } from "react";
import { LoaderFunction, ActionFunction, json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { PrismaClient } from "@prisma/client";
import { authenticator } from "~/utils/auth.server";

const prisma = new PrismaClient();

export const loader: LoaderFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);

  if (!user) {
    throw new Response("User is not authenticated", { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    throw new Response("Product ID is required", { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!product) {
    throw new Response("Product not found", { status: 404 });
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: {
      items: { where: { productId: id } },
    },
  });

  const quantityInCart = cart?.items[0]?.quantity || 0;

  return json({ product, username: user.username, quantityInCart });
};

export const action: ActionFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);

  if (!user) {
    throw new Response("User is not authenticated", { status: 401 });
  }

  const formData = await request.formData();
  const productId = formData.get("productId") as string;

  if (!productId) {
    return json({ error: "Product ID is required" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return json({ error: "Product not found" }, { status: 404 });
  }

  let cart = await prisma.cart.findUnique({
    where: { userId: user.id },
  });

  const existingCartItem = cart
    ? await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    })
    : null;

  const currentQuantity = existingCartItem ? existingCartItem.quantity : 0;
  const newQuantity = currentQuantity + 1;

  if (newQuantity > product.stock) {
    return json(
      { error: `Stok tidak mencukupi. Tersedia hanya ${product.stock}` },
      { status: 400 }
    );
  }

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: user.id },
    });
  }

  if (existingCartItem) {
    await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: { quantity: newQuantity },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity: 1,
      },
    });
  }

  return json({ success: true });
};

const DetailProdukPage = () => {
  const { product, username, quantityInCart } = useLoaderData<typeof loader>();
  const [feedback, setFeedback] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false); // State untuk mengontrol popup
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const nextImage = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === product.images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? product.images.length - 1 : prevIndex - 1
    );
  };

  const handleAddToCart = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);

    const response = await fetch(window.location.href, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      setFeedback("Produk berhasil ditambahkan ke keranjang!");
      setShowPopup(true); // Menampilkan popup setelah produk berhasil ditambahkan
      timeoutRef.current = setTimeout(() => { setShowPopup(false), window.location.reload() }, 3000);
    } else {
      const result = await response.json();
      setFeedback(result.error || "Terjadi kesalahan.");
      setShowPopup(true);
      timeoutRef.current = setTimeout(() => setShowPopup(false), 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="sticky top-0 flex items-center justify-between p-4 bg-white z-10 shadow">
        <button onClick={() => navigate("/")} className="text-gray-300">
          <i className="fas fa-home"></i>
        </button>
        <div className="text-gray-700 font-bold text-sm mx-auto">
          Hi, {username || "User"}
        </div>
        <button onClick={() => navigate("/cart")} className="text-gray-300">
          <i className="fas fa-shopping-cart"></i>
        </button>
      </header>

      <main className="flex-grow px-6 py-4">
        <div className="relative flex justify-center items-center py-4">
          <button onClick={prevImage} className="absolute left-0 text-gray-300 p-2">
            <i className="fas fa-chevron-left"></i>
          </button>
          <img
            src={
              product.images.length > 0
                ? product.images[currentIndex]?.url
                : "https://placehold.co/300x300?text=No+Image"
            }
            alt={`Product ${currentIndex + 1}`}
            className="w-56 h-56 md:w-64 md:h-64 object-cover"
          />
          <button onClick={nextImage} className="absolute right-0 text-gray-300 p-2">
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>

        <div className="bg-gray-100 p-6">
          <h1 className="text-md sm:text-lg md:text-xl font-semibold">{product.name}</h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-2">
            Size: {product.size || "N/A"}
          </p>
          <div className="flex justify-between items-center mt-3">
            <span className="text-yellow-500 text-md sm:text-lg md:text-xl font-bold">
              Rp {product.price.toLocaleString()}
            </span>
            <span className="text-gray-500 text-xs sm:text-sm md:text-base">
              Stok: {product.stock}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-sm sm:text-md md:text-lg font-bold">
            DETAIL PRODUK
          </h2>
          <ul className="list-disc list-inside text-xs sm:text-sm md:text-base text-gray-700 mt-2">
            {product.description.split("\n").map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
        </div>
      </main>

      <footer className="bg-yellow-300 flex justify-center items-center shadow p-4">
        <form onSubmit={handleAddToCart}>
          <input type="hidden" name="productId" value={product.id} />
          <button
            type="submit"
            className="text-black text-xs sm:text-sm font-bold py-3 px-6 rounded-full flex flex-col items-center space-y-1"
            disabled={quantityInCart >= product.stock}
          >
            <div className="border-2 border-black rounded-lg pt-1 pb-1 pl-3 pr-3">
              <i className="fas fa-plus"></i>
            </div>
            <span>
              {quantityInCart >= product.stock ? "Stok habis" : "Tambahkan ke Keranjang"}
            </span>
          </button>
        </form>
      </footer>
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white border-2 border-green-600 p-6 rounded-lg w-80 text-center">
            <div className="text-green-600 mb-4">
              <i className="fas fa-check-circle"></i>
            </div>
            <h2 className="text-xl font-semibold text-green-600 mb-2">Berhasil!</h2>
            <p className="text-gray-600">{feedback}</p>
            <button
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
              onClick={() => {
                setShowPopup(false);
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                }
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailProdukPage;