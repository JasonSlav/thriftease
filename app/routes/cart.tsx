import { json, redirect } from "@remix-run/node";
import { prisma } from "~/utils/prisma.server";
import { useLoaderData, Form, useNavigate } from "@remix-run/react";
import { authenticator } from "~/utils/auth.server";
import React, { useState } from "react";
import { saveTemporaryOrder } from "~/utils/orders.server";

// Backend
export const loader = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);
  if (!user) return redirect("/login");

  // Fetch cart data
  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true,
               // Include product images
            },
          },
        },
      },
    },
  });

  return json({ cart: cart || { items: [] } });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const actionType = formData.get("action");
  const itemId = formData.get("itemId");
  const user = await authenticator.isAuthenticated(request);

  if (!user) return redirect("/login");

  if (actionType === "checkout") {
    const cartData = JSON.parse(formData.get("cartData"));
    const shippingCost = 15000;

    const orderData = {
      user,
      cartData,
      shippingCost,
      total:
        cartData.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        ) + shippingCost,
    };

    await saveTemporaryOrder(user.id, orderData);

    return redirect("/pesanan");
  }

  if (actionType === "updateQuantity") {
    const quantity = parseInt(formData.get("quantity"), 10);

    // Get the product's stock
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        product: true, // Include product to get stock information
      },
    });

    if (!cartItem) return redirect("/cart");

    const maxStock = cartItem.product.stock;
    if (quantity <= maxStock && quantity > 0) {
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
    }
  } else if (actionType === "removeItem") {
    await prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  return redirect("/cart");
};

// Frontend
export default function CartPage() {
  const { cart } = useLoaderData();
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState(
    Array(cart.items.length).fill(false)
  ); // Initializing selectedItems based on the cart items
  const [selectAll, setSelectAll] = useState(false); // Status checkbox "Pilih Semua"
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemsToRemove, setItemsToRemove] = useState([]);
  // Fungsi untuk menangani klik pada checkbox item
  const handleItemChange = (index) => {
    const updatedItems = [...selectedItems];
    updatedItems[index] = !updatedItems[index];
    setSelectedItems(updatedItems);

    // Update status "Pilih Semua"
    const allChecked = updatedItems.every((item) => item);
    setSelectAll(allChecked);
  };

  // Fungsi untuk menangani klik pada checkbox "Pilih Semua"
  const handleSelectAllChange = () => {
    const newState = !selectAll;
    setSelectAll(newState);
    setSelectedItems(selectedItems.map(() => newState));
  };

  // Remove selected items logic
  const handleRemoveSelected = () => {
    const items = cart.items.filter((_, index) => selectedItems[index]);
    setItemsToRemove(items);
    setShowConfirmModal(true);
  };

  const confirmRemoveItems = () => {
    itemsToRemove.forEach((item) => {
      fetch("/cart", {
        method: "POST",
        body: new URLSearchParams({
          action: "removeItem",
          itemId: item.id,
        }),
      })
        .then(() => {
          setSelectedItems(
            selectedItems.filter((_, index) => !selectedItems[index])
          );
          setTimeout(() => {
            window.location.reload();
          }, 300);
        })
        .catch((error) => console.error("Error removing item:", error));
    });
    setShowConfirmModal(false);
  };

  // Calculate the total price of selected items
  const selectedTotal = cart.items
    .filter((_, index) => selectedItems[index]) // Only selected items
    .reduce((total, item) => total + item.product.price * item.quantity, 0)
    .toLocaleString("id-ID"); // Format as Indonesian currency

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between border-b pb-2 lg:pb-4 mb-4 lg:mb-6 w-full px-4 lg:px-8 bg-white pt-4">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 lg:w-10 lg:h-10 bg-yellow-300 rounded-full flex items-center justify-center"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="text-xl lg:text-2xl font-bold">Keranjang</h1>
        <button
          onClick={handleRemoveSelected}
          disabled={!selectedItems.some((item) => item)}
          className="text-yellow-300 text-2xl"
        >
          <i className="fas fa-trash"></i>
        </button>
      </header>

      <div className="w-full max-w-md lg:max-w-full mx-auto p-4 lg:p-8 flex-grow lg:px-16 md:max-w-3xl">
        <main className="p-4 flex-grow md:px-8">
          {cart?.items?.length === 0 ? (
            <p className="text-gray-600 text-center font-bold text-sm md:text-base">
              Keranjang Anda kosong.
            </p>
          ) : (
            cart.items.map((item, index) => (
              <div
                key={item.id}
                className="bg-white shadow-lg rounded-lg p-4 flex items-center mb-4 md:space-x-4 space-x-2"
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  className="form-checkbox text-yellow-300 h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-4"
                  checked={selectedItems[index]}
                  onChange={() => handleItemChange(index)}
                />

                {/* Gambar dan Detail Produk */}
                <div className="flex-shrink-0">
                  <img
                    src={item.product.images[0]?.url || "/placeholder.png"}
                    alt={item.product.name}
                    className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-md"
                  />
                </div>
                <div className="ml-2 md:ml-4 flex-grow">
                  <p className="font-semibold text-sm md:text-base line-clamp-1 overflow-hidden text-ellipsis">
                    {item.product.name}
                  </p>
                  <p className="text-gray-500 text-xs md:text-sm">
                    Size: {item.product.size}
                  </p>
                  <p className="font-semibold text-yellow-300 text-sm md:text-base">
                    Rp. {item.product.price.toLocaleString()}
                  </p>
                  <div className="flex items-center space-x-2 mt-2 float-end">
                    <Form method="post" className="flex items-center space-x-2">
                      <input type="hidden" name="itemId" value={item.id} />
                      <input
                        type="hidden"
                        name="action"
                        value="updateQuantity"
                      />
                      <button
                        type="submit"
                        name="quantity"
                        value={item.quantity - 1}
                        className="w-6 h-6 md:w-8 md:h-8 bg-yellow-300 text-white rounded-full flex items-center justify-center"
                        disabled={item.quantity <= 1}
                      >
                        <p className="justify-center items-center font-bold text-xs md:text-lg">
                          -
                        </p>
                      </button>
                      <span className="px-2 py-1 border border-gray-300 rounded-md text-xs md:text-sm">
                        {item.quantity}
                      </span>
                      <button
                        type="submit"
                        name="quantity"
                        value={item.quantity + 1}
                        className="w-6 h-6 md:w-8 md:h-8 bg-yellow-300 text-white rounded-full flex items-center justify-center"
                        disabled={item.quantity >= item.product.stock}
                      >
                        <p className="justify-center items-center font-bold text-xs md:text-lg">
                          +
                        </p>
                      </button>
                    </Form>
                  </div>
                </div>
              </div>
            ))
          )}
        </main>
      </div>

      <footer className="sticky bottom-0 bg-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={handleSelectAllChange}
          />
          <span className="ml-2">Pilih Semua</span>
        </div>
        <div className="flex">
          <div className="text-right mr-4 font-bold items-center flex">
            <p className="text-sm md:text-base">Total: Rp. {selectedTotal}</p>
          </div>

          <button
            className={`${
              selectedItems.some((item) => item) && cart.items.length > 0
                ? "bg-yellow-300"
                : "bg-gray-300 cursor-not-allowed"
            } py-2 px-4 rounded`}
            disabled={
              cart.items.length === 0 || !selectedItems.some((item) => item)
            }
            onClick={(e) => {
              if (
                cart.items.length === 0 ||
                !selectedItems.some((item) => item)
              ) {
                e.preventDefault();
                return;
              }
              fetch("/cart", {
                method: "POST",
                body: new URLSearchParams({
                  action: "checkout",
                  cartData: JSON.stringify(
                    cart.items.filter((_, index) => selectedItems[index]) // Filter item yang dipilih
                  ),
                }),
              }).then(() => navigate("/pesanan"));
            }}
          >
            <p className="font-semibold">
              Checkout (
              {selectedItems.filter((isSelected) => isSelected).length})
            </p>
          </button>
        </div>
      </footer>
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              Konfirmasi Hapus
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus item yang dipilih dari
              keranjang?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
              >
                Batal
              </button>
              <button
                onClick={confirmRemoveItems}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
