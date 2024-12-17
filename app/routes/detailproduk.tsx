import { LoaderFunction, ActionFunction, json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { PrismaClient } from "@prisma/client";
import { authenticator } from "~/utils/auth.server";
import React, { useState } from "react";

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
    where: { id: String(id) },
    include: { images: true },
  });

  if (!product) {
    throw new Response("Product not found", { status: 404 });
  }

  return json({ product, username: user.username });
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

  let cart = await prisma.cart.findUnique({
    where: { userId: user.id },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: user.id },
    });
  }

  const existingCartItem = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId },
  });

  if (existingCartItem) {
    await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: { quantity: existingCartItem.quantity + 1 },
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
  const { product, username } = useLoaderData<typeof loader>();
  const [feedback, setFeedback] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const [showFeedback, setShowFeedback] = useState(false);

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
      setShowFeedback(true);
      setTimeout(() => {
        setShowFeedback(false);
      }, 3000);
    } else {
      const result = await response.json();
      setFeedback(result.error || "Terjadi kesalahan.");
      setShowFeedback(true);
      setTimeout(() => {
        setShowFeedback(false);
      }, 3000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white relative">
      {/* Overlay feedback */}
      {showFeedback && (
        <div
          className={`absolute top-0 left-0 w-full flex justify-center items-center z-50 transition-opacity duration-1000 ${
            showFeedback ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="bg-green-200 text-green-800 py-2 px-4 rounded shadow-lg">
            {feedback}
          </div>
        </div>
      )}

      <header className="sticky top-0 flex justify-between items-center p-4 bg-white z-10 shadow">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 lg:w-10 lg:h-10 bg-yellow-300 rounded-full flex items-center justify-center"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="relative flex space-x-4">
          <button onClick={() => navigate("/cart")} className="text-yellow-400">
            <i className="fas fa-shopping-cart"></i>
          </button>
        </div>
      </header>

      <main className="flex-grow px-6 py-4">
        <div className="relative flex justify-center items-center py-4">
          <button
            onClick={prevImage}
            className="absolute left-0 text-black p-2"
          >
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
          <button
            onClick={nextImage}
            className="absolute right-0 text-black p-2"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>

        <div className="flex justify-center space-x-2 mb-4">
          {product.images.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index === currentIndex ? "bg-yellow-300" : "bg-gray-300"
              }`}
            ></div>
          ))}
        </div>

        <div className="bg-gray-100 p-6">
          <h1 className="text-md sm:text-lg md:text-xl font-semibold">
            {product.name}
          </h1>
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

      <footer className="sticky bottom-0 bg-yellow-300 flex justify-center items-center shadow">
        <form onSubmit={handleAddToCart}>
          <input type="hidden" name="productId" value={product.id} />
          <button
            type="submit"
            className="text-black text-xs sm:text-sm font-bold py-3 px-6 rounded-full flex flex-col items-center space-y-1"
          >
            <div className="border-2 border-black rounded-lg pt-1 pb-1 pl-3 pr-3">
              <i className="fas fa-plus"></i>
            </div>
            <span>Tambahkan ke Keranjang</span>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default DetailProdukPage;