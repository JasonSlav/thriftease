import { useState } from 'react';
import { useSearchParams, useNavigate } from '@remix-run/react';
import { json, type DataFunctionArgs } from '@remix-run/node';
import { prisma } from '../utils/prisma.server';
import bcrypt from 'bcryptjs';

// Server-side action untuk menangani reset password
export async function action({ request }: DataFunctionArgs) {
  const formData = await request.formData();
  const token = formData.get('token') as string;
  const newPassword = formData.get('newPassword') as string;

  if (!token || !newPassword) {
    return json({ error: 'Token dan password baru harus diisi.' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiresAt: { gte: new Date() }, // Token masih berlaku
      },
    });

    if (!user) {
      return json({ error: 'Token tidak valid atau telah kedaluwarsa.' }, { status: 400 });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user dengan password baru dan hapus token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    return json({ message: 'Password berhasil direset. Anda dapat login sekarang.' });
  } catch (error) {
    console.error('Error during password reset:', error);
    return json({ error: 'Terjadi kesalahan saat mereset password.' }, { status: 500 });
  }
}

// Client-side React component untuk halaman reset password
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Token tidak ditemukan.');
      return;
    }

    try {
      const response = await fetch('/reset-password', {
        method: 'POST',
        body: new URLSearchParams({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Terjadi kesalahan.');
      } else {
        setSuccess(data.message);
        setTimeout(() => navigate('/login'), 3000); // Redirect ke login setelah 3 detik
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan saat menghubungi server.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-xs mx-auto">
        <h1 className="text-2xl font-bold text-center mb-4">Reset Password</h1>
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        {success && <div className="text-green-500 text-center mb-4">{success}</div>}
        {!success && (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <span
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                  onClick={togglePasswordVisibility}
                >
                  <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" htmlFor="confirm-password">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <span
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                  onClick={toggleConfirmPasswordVisibility}
                >
                  <i className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </span>
              </div>
            </div>
            <button className="w-full p-3 bg-yellow-300 text-black font-bold rounded shadow-md hover:bg-yellow-400">
              Kirim
            </button>
          </form>
        )}
      </div>
    </div>
  );
}