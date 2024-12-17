import React, { useEffect, useState } from "react";
import { useNavigate, useLoaderData, useNavigate } from "@remix-run/react";
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Loader untuk mengambil data transaksi
export const loader = async () => {
  const payments = await prisma.payment.findMany({
    include: {
      order: true, // Include informasi pesanan terkait transaksi
    },
  });

  return json({ payments });
};

// Action untuk mengupdate status transaksi

export const action = async ({ request }) => {
  const formData = await request.formData();
  const actionType = formData.get("actionType"); // 'updateStatus' atau 'delete'
  const paymentId = formData.get("paymentId");
  const status = formData.get("status");
  const paymentDate = formData.get("paymentDate"); // Tanggal pembayaran baru

  if (!paymentId || (actionType === "updateStatus" && !status)) {
    return json({ error: "Payment ID dan status diperlukan" }, { status: 400 });
  }

  try {
    if (actionType === "delete") {
      await prisma.payment.delete({
        where: { id: paymentId },
      });
    } else if (actionType === "updateStatus") {
      const updateData = { status };

      // Tambahkan paymentDate jika status SUCCESS
      if (status === "SUCCESS" && paymentDate) {
        updateData.paymentDate = new Date(paymentDate);
      }

      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: updateData,
        include: { order: { include: { items: true } } },
      });

      // Jika status transaksi diubah menjadi FAILED
      if (status === "FAILED") {
        // Ubah status pesanan menjadi CANCELLED
        await prisma.order.update({
          where: { id: payment.order.id },
          data: { status: "CANCELLED" },
        });

        // Set isVisible menjadi true untuk setiap produk dalam pesanan
        const productUpdates = payment.order.items.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: { isVisible: true },
          })
        );
        await Promise.all(productUpdates);
      }
    }

    return json({ success: true });
  } catch (error) {
    console.error(error);
    return json(
      { error: "Gagal mengupdate atau menghapus transaksi" },
      { status: 500 }
    );
  }
};

const AdminTransaksiPage = () => {
  const navigate = useNavigate();
  const { payments } = useLoaderData();
  const [searchTerm, setSearchTerm] = useState("");

  const handleDeletePayment = async (paymentId) => {
    const confirmDelete = window.confirm(
      "Apakah Anda yakin ingin menghapus transaksi ini?"
    );
    if (!confirmDelete) return;

    const response = await fetch(`/admin-transaksi`, {
      method: "POST",
      body: new URLSearchParams({ paymentId, actionType: "delete" }),
    });

    if (!response.ok) {
      alert("Gagal menghapus transaksi");
    } else {
      alert("Transaksi berhasil dihapus");
      window.location.reload();
    }
  };

  // Filter transaksi berdasarkan kata kunci pencarian
  const filteredPayments = payments.filter((payment) =>
    payment.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fungsi untuk mengupdate status transaksi
  const handleStatusUpdate = async (paymentId, newStatus) => {
    if (!newStatus) return;

    const paymentDate =
      newStatus === "SUCCESS" ? new Date().toISOString() : null;

    const response = await fetch(`/admin-transaksi`, {
      method: "POST",
      body: new URLSearchParams({
        paymentId,
        status: newStatus,
        paymentDate,
        actionType: "updateStatus",
      }),
    });

    if (!response.ok) {
      alert("Gagal mengupdate status transaksi");
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
        <h2 className="text-lg font-semibold text-center w-full">Transaksi</h2>
      </div>
      <main className="p-4">
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Cari Transaksi..."
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
              <th className="p-2 border border-gray-300">Pesanan</th>
              <th className="p-2 border border-gray-300">Metode</th>
              <th className="p-2 border border-gray-300">Status</th>
              <th className="p-2 border border-gray-300">Jumlah</th>
              <th className="p-2 border border-gray-300">Tanggal Pembayaran</th>
              <th className="p-2 border border-gray-300">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-100">
                <td className="p-2 border border-gray-300">{payment.id}</td>
                <td className="p-2 border border-gray-300">
                  {payment.order.id}
                </td>
                <td className="p-2 border border-gray-300">{payment.method}</td>
                <td className="p-2 border border-gray-300">
                  <select
                    value={payment.status}
                    onChange={(e) =>
                      handleStatusUpdate(payment.id, e.target.value)
                    }
                    className="p-1 border border-gray-300 rounded"
                  >
                    {["PENDING", "SUCCESS", "FAILED"].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border border-gray-300">
                  Rp {payment.amount.toLocaleString()}
                </td>
                <td className="p-2 border border-gray-300">
                  {new Date(payment.updatedAt).toLocaleDateString()}
                </td>
                <td className="p-2 border border-gray-300">
                  <button
                    className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                    onClick={() => handleDeletePayment(payment.id)}
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

export default AdminTransaksiPage;
