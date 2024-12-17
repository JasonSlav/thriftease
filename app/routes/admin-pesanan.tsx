import React, { useEffect, useState } from "react";
import { useNavigate, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Loader untuk mengambil data pesanan
export const loader = async () => {
  const orders = await prisma.order.findMany({
    include: {
      user: true, // Include informasi user terkait pesanan
    },
  });

  return json({ orders });
};

// Action untuk mengupdate status pesanan

export const action = async ({ request }) => {
  const formData = await request.formData();
  const actionType = formData.get("actionType"); // 'updateStatus' atau 'delete'
  const orderId = formData.get("orderId");
  const status = formData.get("status");

  if (!orderId || (actionType === 'updateStatus' && !status)) {
    return json({ error: "Order ID dan status diperlukan" }, { status: 400 });
  }

  try {
    if (actionType === 'delete') {
      // Hapus catatan pembayaran terkait
      await prisma.payment.deleteMany({
        where: { orderId },
      });

      // Hapus pesanan
      await prisma.order.delete({
        where: { id: orderId },
      });
    } else if (actionType === 'updateStatus') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status },
      });
    }

    return json({ success: true });
  } catch (error) {
    console.error(error);
    return json({ error: "Gagal mengupdate atau menghapus pesanan" }, { status: 500 });
  }
};


const AdminPesananPage = () => {
  const navigate = useNavigate();
  const { orders } = useLoaderData();
  const [searchTerm, setSearchTerm] = useState("");
  const handleDeleteOrder = async (orderId) => {
    const confirmDelete = window.confirm(
      "Apakah Anda yakin ingin menghapus pesanan ini?"
    );
    if (!confirmDelete) return;

    const response = await fetch(`/admin-pesanan`, {
      method: "POST",
      body: new URLSearchParams({ orderId, actionType: "delete" }),
    });

    if (!response.ok) {
      alert("Gagal menghapus pesanan");
    } else {
      alert("Pesanan berhasil dihapus");
      window.location.reload();
    }
  };

  // Filter pesanan berdasarkan kata kunci pencarian
  const filteredOrders = orders.filter((order) =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fungsi untuk mengupdate status pesanan
  const handleStatusUpdate = async (orderId, newStatus) => {
    const response = await fetch(`/admin-pesanan`, {
      method: "POST",
      body: new URLSearchParams({ 
        orderId, 
        status: newStatus, 
        actionType: "updateStatus" 
      }),
    });
  
    if (!response.ok) {
      alert("Gagal mengupdate status pesanan");
    } else {
      window.location.reload();
    }
  };
  
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
        <h2 className="text-lg font-semibold text-center w-full">Pesanan</h2>
      </div>


      <main className="p-4">
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Cari Pesanan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 rounded-md border border-gray-300 focus:outline-none focus:border-yellow-300"
          />
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>

        <table className="w-full border-collapse border border-gray-300 bg-white rounded-md">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2 border border-gray-300">ID</th>
              <th className="p-2 border border-gray-300">User</th>
              <th className="p-2 border border-gray-300">Status</th>
              <th className="p-2 border border-gray-300">Total</th>
              <th className="p-2 border border-gray-300">Dibuat</th>
              <th className="p-2 border border-gray-300">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-100">
                <td className="p-2 border border-gray-300">{order.id}</td>
                <td className="p-2 border border-gray-300">{order.user.id}</td>
                <td className="p-2 border border-gray-300">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusUpdate(order.id, e.target.value)
                    }
                    className="p-1 border border-gray-300 rounded"
                  >
                    {[
                      "PENDING",
                      "PROCESSING",
                      "SHIPPED",
                      "DELIVERED",
                      "CANCELLED",
                      "COMPLETED",
                    ].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border border-gray-300">
                  Rp {order.totalAmount.toLocaleString()}
                </td>
                <td className="p-2 border border-gray-300">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="p-2 border border-gray-300">
                  <button
                    className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                    onClick={() => handleDeleteOrder(order.id)}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default AdminPesananPage;
