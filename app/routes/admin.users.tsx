import { PrismaClient, User } from "@prisma/client";
import { LoaderFunction, json, ActionFunction,  } from "@remix-run/node";
import { requireAdmin } from "~/utils/session.server";
import bcrypt from "bcryptjs";

export const action: ActionFunction = async ({ request }) => {
  await requireAdmin(request);
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const address = formData.get("address") as string;
  const role = formData.get("role") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const id = formData.get("id") as string;
  const action = formData.get("_action") as string;

  switch (action) {
    case "delete": {
      await prisma.user.delete({
        where: {
          id: id,
        },
      });
      break;
    } case "create": {
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          fullName,
          address,
          role,
          phoneNumber,
        },
      });
      break;
    } case "update": {
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: {
          id: id,
        },
        data: {
          email,
          username,
          password: hashedPassword,
          fullName,
          address,
          role,
          phoneNumber,
        },
      });
      break;
    }
  }
}

const prisma = new PrismaClient();

export const loader: LoaderFunction = async ({ request }) => { // Definisikan loader function yang akan dijalankan saat halaman diakses
  await requireAdmin(request); // Periksa hak akses admin sebelum melanjutkan
  const users = await prisma.user.findMany({ // Cari data pengguna dari database
    take: 100, // Ambil 100 data pengguna pertama
    skip: 0, // Lewati 0 data pengguna pertama
    select: { // Pilih kolom yang ingin diambil
      id: true,
      username: true,
      email: true,
      password: false,
      fullName: true,
      address: true,
      phoneNumber: true,
      createdAt: true,
      role: true
    }
  });
  return json({ users }); // Kembalikan data pengguna dalam format JSON
};

// Komponen untuk menampilkan users
export function UsersTable({ user }: { user: User }) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Username
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Email
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Nama Lengkap
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Role
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Tanggal Dibuat
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        <tr key={user.id}>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">{user.username}</div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">{user.email}</div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">{user.fullName}</div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
              {user.role}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {user.createdAt.toLocaleDateString()}
          </td>
        </tr>
      </tbody>
    </table>
  );
}