import image from "../foto/check_15526401 1.png";

const SuccessGantiEmailPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center p-4">
        <p className="text-black text-base mb-6">
          Cek email Anda untuk tautan mengganti email. Jika tidak muncul dalam
          beberapa menit, periksa folder spam Anda.
        </p>
        <div className="flex justify-center mb-6">
          <img src={image} alt="Illustration" className="mx-auto mb-4" />
        </div>
      </div>
    </div>
  );
};

export default SuccessGantiEmailPage;