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
    return new Response(JSON.stringify({ error: "Semua field harus diisi." }), {
      status: 400,
    });
  }

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  });

  if (!userData || !(await bcrypt.compare(oldPassword, userData.password))) {
    return new Response(JSON.stringify({ error: "Password lama salah." }), {
      status: 400,
    });
  }

  if (oldPassword === newPassword) {
    return new Response(JSON.stringify({ error: "Password baru tidak boleh sama dengan password lama." }), {
      status: 400,
    });
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
  const navigate = useNavigate();

  const toggleOldPasswordVisibility = () => {
    setShowOldPassword((prev) => !prev);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const response = await fetch(window.location.pathname, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        navigate("/success-changepassword");
      } else {
        const data = await response.json();
        setErrorMessage(data.error);
      }
    } catch (error) {
      setErrorMessage("Terjadi kesalahan saat memproses permintaan Anda.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
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
      <div className="flex items-center justify-center mt-16 bg-white">
        <div className="w-full max-w-xs mx-auto">
          <img src={image} alt="Illustration" className="mx-auto mb-4" />
          <p className="text-center text-gray-700 mb-8">
            Masukkan password lama dan password baru untuk mengganti password
            Anda
          </p>
          {errorMessage && (
            <p className="text-red-500 text-center mb-4">{errorMessage}</p>
          )}
          <form method="post" className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                className="block text-sm font-bold mb-2"
                htmlFor="oldPassword"
              >
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
                    className={`fas ${
                      showOldPassword ? "fa-eye-slash" : "fa-eye"
                    }`}
                  ></i>
                </span>
              </div>
            </div>
            <div>
              <label
                className="block text-sm font-bold mb-2"
                htmlFor="newPassword"
              >
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
                    className={`fas ${
                      showNewPassword ? "fa-eye-slash" : "fa-eye"
                    }`}
                  ></i>
                </span>
              </div>
            </div>
            <button
              type="submit"
              className="w-full p-3 bg-yellow-300 text-black font-bold rounded shadow-md hover:bg-yellow-400"
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
