import { useState, useEffect } from 'react';

export default function VerifyOtpPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60); // Timer untuk countdown
  const [isOtpSent, setIsOtpSent] = useState(false); // Menyimpan status apakah OTP sudah dikirim

  useEffect(() => {
    if (timer > 0 && isOtpSent) {
      const interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer, isOtpSent]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    // Kirim request untuk mengirim OTP ke email
    const res = await fetch(`/api/sendOtp?email=${email}`);
    const data = await res.json();

    if (data.error) {
      setError(data.error);
    } else {
      setMessage('OTP telah dikirim ke email Anda.');
      setIsOtpSent(true); // Menandai bahwa OTP sudah dikirim
      setTimer(60); // Reset timer
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        {/* Bagian pertama: Form Kirim OTP */}
        {!isOtpSent && (
          <>
            <h1 className="text-2xl font-bold mb-4">Verifikasi Email Anda</h1>
            <form onSubmit={handleSubmit}>
              <label>
                Email:
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded mb-4"
                />
              </label>
              <button
                type="submit"
                className="w-full bg-yellow-300 text-black py-2 px-4 rounded shadow-md hover:shadow-lg font-bold"
              >
                Kirim OTP
              </button>
            </form>

            {message && <p className="mt-4 text-green-500">{message}</p>}
            {error && <p className="mt-4 text-red-500">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
