import { useState } from "react";
import image from "../foto/rb_8863 1.png";
import { ActionFunction, LoaderFunction, redirect } from "@remix-run/node";
import { authenticator } from "~/utils/auth.server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { useNavigate } from "@remix-run/react";

const prisma = new PrismaClient();

export const loader: LoaderFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return redirect("/login");
  }

  return null;
};

export const action: ActionFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return redirect("/login");
  }

  const formData = await request.formData();
  const oldPassword = formData.get("oldPassword");
  const newPassword = formData.get("newPassword");

  if (!oldPassword || !newPassword) {
    return { error: "Semua field harus diisi." };
  }

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  });

  if (!userData || !(await bcrypt.compare(oldPassword, userData.password))) {
    return { error: "Password lama salah." };
  }

  if (oldPassword === newPassword) {
    return { error: "Password baru tidak boleh sama dengan password lama." };
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedNewPassword },
  });

  return redirect("/success-changepassword");
};

const ChangePasswordPage = () => {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const toggleOldPasswordVisibility = () => {
    setShowOldPassword((prev) => !prev);
  };
  const toggleNewPasswordVisibility = () => {
    setShowNewPassword((prev) => !prev);
  };
  const navigate = useNavigate();

  const handleClick = () => {
    setTimeout(() => {
      // Panggil API logout
      fetch("/logout", {
        method: "POST", // Gunakan metode HTTP yang sesuai
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (response.ok) {
            // Arahkan ke halaman success setelah logout berhasil
            navigate("/success-changepassword");
          } else {
            console.error("Logout gagal:", response.statusText);
          }
        })
        .catch((error) => {
          console.error("Terjadi kesalahan:", error);
        });
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="relative flex items-center justify-between border-b pb-2 lg:pb-4 mb-4 lg:mb-6 w-full px-4 lg:px-8 bg-white pt-4">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 lg:w-10 lg:h-10 bg-yellow-300 rounded-full flex items-center justify-center"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-xl lg:text-2xl font-bold">
          Ganti Password
        </h1>
      </header>
      <div className="flex items-center justify-center h-screen">
        <div className="w-full max-w-xs mx-auto">
          <img src={image} alt="Illustration" className="mx-auto mb-4" />
          <p className="text-center text-gray-700 mb-8">
            Masukkan password lama dan password baru untuk mengganti password Anda
          </p>
          {errorMessage && (
            <p className="text-red-500 text-center mb-4">{errorMessage}</p>
          )}
          <form
            method="post"
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              fetch(window.location.pathname, {
                method: "POST",
                body: formData,
              })
                .then((response) => response.json())
                .then((data) => {
                  if (data.error) {
                    setErrorMessage(data.error);
                  } else {
                    navigate("/success-changepassword");
                  }
                });
            }}
          >
            <div>
              <label className="block text-sm font-bold mb-2" htmlFor="oldPassword">
                Password Lama
              </label>
              <div className="relative">
                <input
                  name="oldPassword"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  type={showOldPassword ? "text" : "password"}
                  id="oldPassword"
                />
                <span
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                  onClick={toggleOldPasswordVisibility}
                >
                  <i
                    className={`fas ${showOldPassword ? "fa-eye-slash" : "fa-eye"}`}
                  ></i>
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" htmlFor="newPassword">
                Password Baru
              </label>
              <div className="relative">
                <input
                  name="newPassword"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                />
                <span
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                  onClick={toggleNewPasswordVisibility}
                >
                  <i
                    className={`fas ${showNewPassword ? "fa-eye-slash" : "fa-eye"}`}
                  ></i>
                </span>
              </div>
            </div>
            <button
            className="w-full p-3 bg-yellow-300 text-black font-bold rounded shadow-md hover:bg-yellow-400"
            onClick={handleClick}
            >
              Ganti Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;