import { useState, useEffect } from "react";
import { Form, useNavigate, useActionData } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { authenticator } from "~/utils/auth.server";
import { createUserSession, getSession } from "~/utils/session.server";
import image from "../foto/pngwing.com(6).png";

// Loader Function
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request);
  if (user) return redirect('/');
  return null;
}

// Action Function
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const user = await authenticator.authenticate("form", request, {
      successRedirect: "/",
      failureRedirect: "/login",
    });

    if (user.role !== "ADMIN"){
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    return createUserSession(user.id, "/");
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Tangani redirect jika menggunakan failureRedirect
    } else if (error instanceof Error) {
      console.log("Error:", error.message); // Debugging log
      return json({ error: error.message }, { status: 401 });
    } else {
      return json({ error: "Unknown error" }, { status: 401 });
    }
  }
};

// Login Component
const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const actionData = useActionData<{ error?: string }>();
  const errorMessage = actionData?.error;
  const navigate = useNavigate();

  useEffect(() => {
    if (formSubmitted && errorMessage) {
      setShowErrorPopup(true);
      setFormSubmitted(false); // Reset `formSubmitted` setelah pop-up muncul
    }
  }, [formSubmitted, errorMessage]);

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center w-full max-w-md p-4">
        <div className="mb-8">
          <i className="fas fa-user-circle text-9xl text-gray-400"></i>
        </div>
        <h1 className="text-2xl font-bold mb-6">Login Account</h1>

        <Form action="/login" method="post" className="w-full">
          <div className="flex items-center border border-black rounded-lg p-2 mb-4">
            <i className="fa fa-user text-gray-400 mr-2"></i>
            <input
              type="text"
              name="login"
              placeholder="Email/Username"
              required
              className="flex-1 outline-none text-gray-500"
            />
          </div>
          <div className="flex items-center border border-black rounded-lg p-2 mb-2">
            <i className="fas fa-lock text-gray-400 mr-2"></i>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              placeholder="Password"
              className="flex-1 outline-none text-gray-500"
            />
            <i
              className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"
                } text-gray-400 cursor-pointer`}
              onClick={togglePasswordVisibility}
            ></i>
          </div>
          <button
            type="button"
            className="float-right mb-2 text-gray-300"
            onClick={() => navigate("/forgot-password")}
          >
            Lupa sandi ?
          </button>

          <button
            type="submit"
            className="w-full bg-yellow-300 text-black font-bold py-2 rounded-lg mb-6 shadow-lg"
          >
            Login
          </button>
        </Form>

        <Form action="/auth/google" method="post" className="w-full">
          <button
            type="submit"
            className="w-full bg-white text-black font-bold py-2 rounded-lg mb-6 shadow-lg flex items-center justify-center space-x-2"
          >
            <img src={image} alt="Google Logo" className="w-5 h-5" />
            <span>Login dengan Google</span>
          </button>
        </Form>

        <div className="text-center mb-4">
          <span className="text-gray-500">Belum terdaftar? </span>
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="text-yellow-300 font-bold underline"
          >
            Buat akun
          </button>
        </div>
        <div className="text-center text-gray-500">
          <p>
            Copyright <i className="far fa-copyright"></i> 2024 ThriftEase
          </p>
        </div>

        {/* Pop-up Error */}
        {showErrorPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white border-2 border-red-600 p-6 rounded-lg w-80 text-center">
              <div className="text-red-600 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-600 mb-2">Daftar Gagal</h2>
              <p className="text-gray-600">{errorMessage || 'Pastikan semua data sudah diisi dengan benar.'}</p>
              <button
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
                onClick={() => setShowErrorPopup(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
