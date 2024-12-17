import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { json, LoaderFunction, redirect } from "@remix-run/node";
import { authenticator } from "~/utils/auth.server";
import { PrismaClient } from "@prisma/client";
import { getTemporaryOrder } from "~/utils/orders.server";
import axios from "axios";

const prisma = new PrismaClient();
// Loader: Fetch order data
export const loader: LoaderFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);
  if (!user) return redirect("/login");

  const userDetails = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      username: true,
      email: true,
      phoneNumber: true,
      fullName: true,
      province: true,
      city: true,
      district: true,
      postalCode: true,
      address: true,
    },
  });

  if (!userDetails) {
    return json("User tidak ditemukan di database.");
  }

  if (!userDetails.address || !userDetails.province || !userDetails.city || !userDetails.district || !userDetails.postalCode || !userDetails.phoneNumber) {
    return redirect("/account");
  }

  const { province, city, district } = userDetails;

  let locationData = { provinceName: null, cityName: null, districtName: null };

  try {
    const [provinceRes, cityRes, districtRes] = await Promise.all([
      axios.get('https://jasonslav.github.io/api-wilayah-indonesia/api/provinces.json'),
      axios.get(`https://jasonslav.github.io/api-wilayah-indonesia/api/regencies/${province}.json`),
      axios.get(`https://jasonslav.github.io/api-wilayah-indonesia/api/districts/${city}.json`),
    ]);

    locationData = {
      provinceName: provinceRes.data.find((item: any) => item.id === province)?.name || null,
      cityName: cityRes.data.find((item: any) => item.id === city)?.name || null,
      districtName: districtRes.data.find((item: any) => item.id === district)?.name || null,
    };
  } catch (error) {
    console.error("Error fetching location data:", error);
  }

  const cartData = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true,
            },
          },
        },
      },
    },
  });

  if (!cartData || cartData.items.length === 0) {
    return redirect("/cart");
  }

  const subtotal = cartData.items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  const shippingCost = 15000;
  const total = subtotal + shippingCost;
  const orderData = getTemporaryOrder(user.id);

  if (!orderData) {
    return redirect("/cart");
  }

  return json({
    user,
    userDetails,
    locationData,
    cartData: cartData.items,
    subtotal,
    shippingCost,
    total,
  });
};

// Action: Confirm order
export const action = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);
  if (!user) return redirect("/login");

  const formData = await request.formData();
  const userDetails = JSON.parse(formData.get("userDetails"));
  const locationData = JSON.parse(formData.get("locationData"));
  const cartData = JSON.parse(formData.get("cartData"));
  const shippingCost = parseFloat(formData.get("shippingCost"));

  // Recalculate subtotal
  const subtotal = cartData.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  const total = subtotal + shippingCost;

  // Start a Prisma transaction to ensure atomicity
  const { order, payment } = await prisma.$transaction(async (prisma) => {
    // Create Order
    const createdOrder = await prisma.order.create({
      data: {
        userId: user.id,
        totalAmount: total,
        items: {
          create: cartData.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    // Create Payment record
    const createdPayment = await prisma.payment.create({
      data: {
        orderId: createdOrder.id,
        method: "BANK_TRANSFER", // Anda bisa mengganti sesuai metode pembayaran yang relevan
        status: "PENDING",
        amount: total,
      },
    });

    const productIds = cartData.map((item) => item.product.id);
    await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { isVisible: false },
    });

    // Clear Cart
    await prisma.cart.delete({ where: { userId: user.id } });

    return { order: createdOrder, payment: createdPayment };
  });

  // Generate WhatsApp message and redirect
  const whatsappMessage = `
*📦 PESANAN-THRIFTEASE 📦*
=========================
📄 *Order ID:* ${order.id}

👤 *Nama Pemesan:* ${userDetails.fullName}
📱 *No. Telepon:* ${userDetails.phoneNumber}
🏡 *Alamat Pengiriman:*
    ${userDetails.address}
    ${locationData.districtName}, ${locationData.cityName},
    ${locationData.provinceName} - ${userDetails.postalCode}

🛒 *Detail Pesanan:*
${order.items
      .map(
        (item) =>
          `- *${item.product.name}*  
      📦 Qty: ${item.quantity}  
      💰 Subtotal: Rp ${(item.price * item.quantity).toLocaleString()}`
      )
      .join("\n")}

=========================
💵 *Subtotal Produk:* Rp ${subtotal.toLocaleString()}
🚚 *Ongkir:* Rp ${shippingCost.toLocaleString()}
=========================
💳 *Total Pembayaran:* Rp ${total.toLocaleString()}
=========================
🙏 Terima kasih telah berbelanja di *Thriftease*!  
Kami akan segera memproses pesanan Anda.

📌 Harap segera lakukan konfirmasi jika ada perubahan informasi.
  `.trim();

  const whatsappUrl = `https://wa.me/6285707293619?text=${encodeURIComponent(
    whatsappMessage
  )}`;
  return redirect(whatsappUrl);
};

// Frontend Component
export default function PesananPage() {
  const { userDetails, locationData, cartData, subtotal, shippingCost, total } =
    useLoaderData();
  const fetcher = useFetcher();

  const handleConfirmOrder = () => {
    fetcher.submit(
      {
        userDetails: JSON.stringify(userDetails),
        locationData: JSON.stringify(locationData),
        cartData: JSON.stringify(cartData),
        total: total.toString(),
        shippingCost: shippingCost.toString(),
      },
      { method: "post" }
    );
  };

  const navigate = useNavigate(); // For navigating back to the previous page

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header Sticky with Bottom Border */}
      <header className="sticky top-0 flex items-center border-b border-gray-300 pb-2 lg:pb-4 mb-4 lg:mb-6 w-full px-4 lg:px-8 bg-white pt-4 z-10">
        <button
          onClick={() => navigate(-1)} // Navigate to the previous page
          className="w-8 h-8 lg:w-10 lg:h-10 bg-yellow-300 rounded-full flex items-center justify-center"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-xl lg:text-2xl font-bold">
          Pesanan
        </h1>
      </header>

      <main className="flex-grow lg:px-8">
        {/* User Information */}
        <div className="p-4">
          <div className="flex">
            <i className="fas fa-map-marker-alt text-yellow-300 text-xl mr-4"></i>
            <h2 className="font-semibold mb-2">Alamat Pengiriman</h2>
          </div>
          <p>{userDetails.fullName}</p>
          <p>{userDetails.phoneNumber}</p>
          <p>
            {userDetails.address}, {locationData.districtName}, {locationData.cityName},{" "}
            {locationData.provinceName}, {userDetails.postalCode}, ID
          </p>
        </div>

        <div className="border-t border-gray-200"></div>

        <div className="p-4">
          <h2 className="font-semibold mb-2">Produk</h2>
          {cartData.map((item) => (
            <div key={item.id} className="p-4 bg-white mb-2 rounded shadow">
              <div className="flex">
                <img
                  src={
                    item.product.images[0]?.url ||
                    "https://placehold.co/100x100"
                  } // Use dynamic image URL or placeholder
                  alt={item.product.name}
                  className="w-20 h-20 object-cover rounded-md"
                />
                <div className="ml-4 flex-grow">
                  <p className="font-semibold">{item.product.name}</p>
                  <p className="text-gray-600">Size: {item.product.size}</p>
                  <p className="font-semibold mt-2">
                    Rp {item.product.price.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-end">
                  <p className="text-gray-600">x{item.quantity}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200"></div>

        {/* Shipping Information */}
        <div className="p-4">
          <h2 className="font-semibold mb-2">Opsi Pengiriman</h2>
          <div className="p-4 border border-gray-400 rounded-md flex justify-between items-center">
            <div className="flex items-center">
              <i className="fas fa-dot-circle text-yellow-300 text-xl"></i>
              <p className="ml-2">Pengiriman Regular</p>
            </div>
            <p>Rp {shippingCost.toLocaleString()}</p>
          </div>
        </div>

        <div className="border-t border-gray-200"></div>

        <div className="p-4">
          <h2 className="font-semibold mb-2">Rincian Pembayaran</h2>
          <div className="flex justify-between mb-2">
            <p>Subtotal untuk Produk</p>
            <p>Rp {(total - shippingCost).toLocaleString()}</p>
          </div>
          <div className="flex justify-between mb-2">
            <p>Subtotal untuk Pengiriman</p>
            <p>Rp {shippingCost.toLocaleString()}</p>
          </div>
          <div className="flex justify-between font-semibold">
            <p>Total Pembayaran</p>
            <p>Rp {total.toLocaleString()}</p>
          </div>
        </div>

        <div className="border-t border-gray-200"></div>
      </main>

      <footer className="p-4 flex items-center justify-between bg-white border-t border-gray-300">
        <div className="flex items-center"></div>
        <div className="flex">
          <div className="text-right mr-4">
            <p className="text-black text-sm font-semibold">Total Pembayaran</p>
            <p className="text-yellow-300 font-bold text-lg">
              Rp {total.toLocaleString()}
            </p>
          </div>
          <button
            onClick={handleConfirmOrder}
            className="bg-yellow-300 text-black font-semibold py-2 px-4 rounded-lg"
          >
            Konfirmasi Pesanan
          </button>
        </div>
      </footer>
    </div>
  );
}