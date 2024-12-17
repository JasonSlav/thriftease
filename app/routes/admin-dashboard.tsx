import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import { PrismaClient, PaymentStatus  } from "@prisma/client";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Prisma Client
const prisma = new PrismaClient();

// Register Chart.js components
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
);

// Helper function to group data by date
// Helper function to group data by date and sort by date ascending
const groupByDate = (data) => {
  const grouped = {};
  data.forEach((item) => {
    const dateKey = format(new Date(item.createdAt), "yyyy-MM-dd");
    if (!grouped[dateKey]) {
      grouped[dateKey] = { count: 0 };
    }
    grouped[dateKey].count += item._count.id;
  });

  // Convert grouped object to sorted array
  return Object.entries(grouped)
    .map(([date, { count }]) => ({ date, count }))
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date ascending
};

// Loader function to fetch data
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  const whereFilter =
    startDate && endDate
      ? { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }
      : {};
  const successFilter = { status: PaymentStatus.SUCCESS };
  const totalTransactions = await prisma.payment.count({
    where: { ...whereFilter, ...successFilter },
  });
  
  const totalIncome = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { ...whereFilter, ...successFilter },
  });

  const orders = await prisma.order.findMany({
    where: {
      ...whereFilter,
      payment: { status: PaymentStatus.SUCCESS },
    },
    select: { createdAt: true, id: true },
  });

  const transactions = await prisma.payment.findMany({
    where: { ...whereFilter, ...successFilter },
    select: { createdAt: true, id: true },
  });

  const dailyOrders = groupByDate(
    orders.map((order) => ({ createdAt: order.createdAt, _count: { id: 1 } }))
  );

  const dailyTransactions = groupByDate(
    transactions.map((transaction) => ({
      createdAt: transaction.createdAt,
      _count: { id: 1 },
    }))
  );

  return json({
    totalTransactions,
    totalOrders: orders.length,
    totalIncome: totalIncome._sum.amount || 0,
    dailyOrders,
    dailyTransactions,
  });
};

// Admin Dashboard Component
const AdminDashboard = () => {
  const {
    totalTransactions,
    totalOrders,
    totalIncome,
    dailyOrders,
    dailyTransactions,
  } = useLoaderData();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const ordersData = {
    labels: dailyOrders.map((order) => order.date),
    datasets: [
      {
        label: "Jumlah Pesanan",
        data: dailyOrders.map((order) => order.count),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const transactionsData = {
    labels: dailyTransactions.map((transaction) => transaction.date),
    datasets: [
      {
        label: "Jumlah Transaksi",
        data: dailyTransactions.map((transaction) => transaction.count),
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  };
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Judul dokumen
    doc.setFontSize(18);
    doc.text("Laporan Dashboard Admin ThriftEase", 10, 10);
  
    // Rentang waktu
    const startDate = searchParams.get("startDate") || "Semua waktu";
    const endDate = searchParams.get("endDate") || "Semua waktu";
    doc.setFontSize(12);
    doc.text(`Rentang Waktu: ${startDate} - ${endDate}`, 10, 20);
  
    // Statistik utama
    doc.text(`Total Pemasukan: Rp. ${totalIncome.toLocaleString()}`, 10, 30);
    doc.text(`Total Transaksi: ${totalTransactions}`, 10, 40);
    doc.text(`Total Pesanan: ${totalOrders}`, 10, 50);
  
    // Data detail pesanan harian
    doc.setFontSize(14);
    doc.text("Detail Pesanan Harian", 10, 60);
    doc.autoTable({
      startY: 65,
      head: [["Tanggal", "Jumlah Pesanan"]],
      body: dailyOrders.map((order) => [order.date, order.count]),
    });
  
    // Data detail transaksi harian
    const transactionsStartY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text("Detail Transaksi Harian", 10, transactionsStartY);
    doc.autoTable({
      startY: transactionsStartY + 5,
      head: [["Tanggal", "Jumlah Transaksi"]],
      body: dailyTransactions.map((transaction) => [transaction.date, transaction.count]),
    });
  
    // Unduh PDF
    doc.save("Laporan-Dashboard-Admin.pdf");
  };
  

  const handleFilter = (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const startDate = form.get("startDate");
    const endDate = form.get("endDate");
    setSearchParams({ startDate, endDate });
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
      <div className="w-full bg-gray-200 py-2 text-center">
        <h2 className="text-lg font-semibold">Dashboard</h2>
      </div>
      <main className="w-full flex flex-col items-center mt-6">
        <form
          className="w-full px-6 flex justify-center space-x-4"
          onSubmit={handleFilter}
        >
          <input
            type="date"
            name="startDate"
            defaultValue={searchParams.get("startDate") || ""}
            className="border rounded-md px-4 py-2"
          />
          <input
            type="date"
            name="endDate"
            defaultValue={searchParams.get("endDate") || ""}
            className="border rounded-md px-4 py-2"
          />
          <button
            type="submit"
            className="bg-yellow-400 text-white px-4 py-2 rounded-md"
          >
            Filter
          </button>
        </form>
        <button
          onClick={generatePDF}
          className="mt-4 bg-yellow-400 text-black px-6 py-2 rounded-md"
        >
          Unduh Laporan PDF
        </button>
        <div className="w-full flex flex-col sm:flex-row justify-center mt-6 space-y-4 sm:space-y-0 sm:space-x-2">
          <div className="bg-white shadow-md p-4 rounded-md w-full sm:w-1/2 md:w-1/4">
            <h3 className="font-semibold text-base sm:text-lg">
              Total Pemasukan
            </h3>
            <p className="text-yellow-400 text-xl sm:text-2xl font-bold">
              Rp. {totalIncome.toLocaleString()}
            </p>
            <p className="text-gray-400 text-sm sm:text-base">
              Dalam rentang waktu
            </p>
          </div>
          <div className="bg-white shadow-md p-4 rounded-md w-full sm:w-1/2 md:w-1/4">
            <h3 className="font-semibold text-base sm:text-lg">
              Total Transaksi
            </h3>
            <p className="text-black text-xl sm:text-2xl font-bold">
              {totalTransactions}
            </p>
            <p className="text-gray-400 text-sm sm:text-base">
              Dalam rentang waktu
            </p>
          </div>
          <div className="bg-white shadow-md p-4 rounded-md w-full sm:w-1/2 md:w-1/4">
            <h3 className="font-semibold text-base sm:text-lg">
              Total Pesanan
            </h3>
            <p className="text-black text-xl sm:text-2xl font-bold">
              {totalOrders}
            </p>
            <p className="text-gray-400 text-sm sm:text-base">
              Dalam rentang waktu
            </p>
          </div>
        </div>

        <div className="w-full mt-6 px-6">
          <h3 className="text-center text-blue-400 font-semibold">
            Grafik Total Pesanan
          </h3>
          <Line data={ordersData} />
        </div>
        <div className="w-full mt-6 px-6">
          <h3 className="text-center text-blue-400 font-semibold">
            Grafik Total Transaksi
          </h3>
          <Line data={transactionsData} />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;