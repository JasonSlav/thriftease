import {
  MetaFunction,
  ActionFunction,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { useLoaderData, useNavigate, Link } from "@remix-run/react";
import { getSession } from "~/utils/session.server";
import { authenticator } from "~/utils/auth.server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Loader to fetch products and user info
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await authenticator.isAuthenticated(request);

  // If user is not authenticated, redirect to login
  if (!user) {
    return redirect("/login");
  }

  const categoryScores = await prisma.searchScore.findMany({
    where: { userId: user.id },
    orderBy: { score: "desc" }, // Urutkan berdasarkan skor tertinggi
  });

  // Fetch products with their related images
  const products = await prisma.product.findMany({
    take: 100, // Limit to 8 products for recommendations
    orderBy: { createdAt: "asc" }, // Order by creation date
    include: { images: true },
    where: { isVisible: true }, // Filter untuk hanya produk yang terlihat
  });

  const userCategories = categoryScores.map((cs) => cs.category);

  // Urutkan produk berdasarkan kategori yang relevan
  const sortedProducts = products.sort((a, b) => {
    const scoreA = userCategories.indexOf(a.category);
    const scoreB = userCategories.indexOf(b.category);

    if (scoreA !== -1 && scoreB !== -1) {
      return scoreA - scoreB;
    }
    if (scoreA !== -1) return -1;
    if (scoreB !== -1) return 1;
    return 0;
  });

  return json({ products: sortedProducts, username: user.name });
};

// Action handler
export const action: ActionFunction = async ({ request }) => {
  await getSession(request);
  return null;
};

// Meta information
export const meta: MetaFunction = () => {
  return [
    { title: "Thrift Ease" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  const { products } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-yellow-300 p-4 sticky top-0 w-full z-10">
        <div className="flex items-center justify-between relative">
          {/* Hi Username */}
          {/* Pencarian */}
          <div className="mx-auto w-3/4">
            <div className="relative">
              <i className="fas fa-search absolute top-1/2 left-4 transform -translate-y-1/2 text-gray-300"></i>
              <input
                type="text"
                placeholder="Cari"
                className="w-full p-2 pl-10 rounded-full border border-gray-300"
                onClick={() => navigate("/search")}

              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="pt-20 bg-gray-100 p-4 flex justify-center">
        <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between w-full md:w-1/2">
          <img
            src="/public/uploads/Group 211.png"
            alt="Man in checkered shirt"
            className="rounded-full w-16 h-16"
          />
          <h1 className="text-xl font-bold text-center">
            Jelajahi Gaya Thrift Terbaik
          </h1>
          <img
            src="uploads/Group 210.png"
            alt="Woman in denim jacket"
            className="rounded-full w-16 h-16"
          />
        </div>
      </div>

      {/* Category Section */}
      <div className="bg-gray-100 p-4 flex justify-center">
        <div className="w-full md:w-1/2">
          <h2 className="text-xl font-bold mb-4 text-center">KATEGORI</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[
              "Jaket",
              "Kemeja",
              "T-Shirt",
              "Celana",
              "Topi",
              "Sepatu",
              "Dress",
              "Rok",
            ].map((category, index) => (
              <button
                key={index}
                onClick={() => navigate(`/searchproduct?category=${category}`)}
                className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center hover:bg-gray-200 transition"
              >
                <img
                  src={`/app/foto/${category} 1.png`}
                  alt={category}
                  className="w-12 h-12 sm:w-16 sm:h-16 mb-2"
                />
                <span className="text-sm sm:text-base">{category}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="bg-gray-100 p-4">
        <h2 className="text-xl font-bold mb-4 text-center">REKOMENDASI</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products.map((product) => (
            <Link
              to={`detailproduk/?id=${product.id}`} // Rute menuju halaman detail produk
              key={product.id}
              className="bg-white p-2 sm:p-4 rounded-lg shadow-md text-xs sm:text-base hover:shadow-lg transition-shadow duration-200"
            >
              <div className="w-full h-48 flex items-center justify-center overflow-hidden rounded-md">
                <img
                  src={
                    product.images.length > 0
                      ? product.images[0].url
                      : "https://placehold.co/300x300?text=No+Image"
                  }
                  alt={product.name}
                  className="object-contain w-full h-full"
                />
              </div>
              <h2 className="text-gray-800 font-semibold mb-1 sm:mb-2 line-clamp-2">
                {product.name}
              </h2>
              <p className="text-gray-600 mb-1 sm:mb-2">
                Stock: {product.stock}
              </p>
              <p className="text-yellow-300 font-bold">
                Rp {product.price.toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bottom-0 w-full bg-yellow-300 p-4 flex justify-around items-center z-10 sticky">
        <div
          className="flex flex-col items-center cursor-pointer"
          onClick={() => navigate("/")}
        >
          <i className="fas fa-home text-2xl text-white"></i>
          <span className="text-white text-sm font-bold">Beranda</span>
        </div>
        <div
          className="flex flex-col items-center cursor-pointer"
          onClick={() => navigate("/cart")}
        >
          <i className="fas fa-shopping-cart text-2xl text-white"></i>
          <span className="text-white text-sm font-bold">Keranjang</span>
        </div>
        <div
          className="flex flex-col items-center cursor-pointer"
          onClick={() => navigate("/profile")}
        >
          <i className="fas fa-user text-2xl text-white"></i>
          <span className="text-white text-sm font-bold">Saya</span>
        </div>
      </footer>
    </div>
  );
}
