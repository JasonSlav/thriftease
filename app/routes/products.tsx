import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getRecommendedProducts } from "~/services/recommendation.server";
import { getUserSession } from "~/utils/session.server";
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUserSession(request);
  const products = await prisma.product.findMany();
  const recommendations = await getRecommendedProducts(user.id);
  
  return json({ products, recommendations });
};

export default function Products() {
  const { products, recommendations } = useLoaderData();
  
  return (
    <div className="container mx-auto px-4">
      <h2 className="text-2xl font-bold mb-4">Rekomendasi Untuk Anda</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {recommendations.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      <h2 className="text-2xl font-bold my-4">Semua Produk</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}