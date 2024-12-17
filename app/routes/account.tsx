import { json, LoaderFunction, redirect } from "@remix-run/node";
import { useEffect, useState } from "react";
import { useNavigate, useLoaderData, Form } from "@remix-run/react";
import { authenticator } from "../utils/auth.server";
import { PrismaClient } from "@prisma/client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const prisma = new PrismaClient();

export const loader: LoaderFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return redirect("/login");
  }

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!userData) {
    throw json({ error: "User not found." }, { status: 404 });
  }

  return json({ user: userData });
};

const KelolaAkunPage = () => {
  const { user } = useLoaderData();
  const [username, setUsername] = useState(user.username || "");
  const [name, setName] = useState(user.fullName || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phoneNumber || "");
  const [address, setAddress] = useState(user.address || "");
  const [province, setProvince] = useState(user.province || "");
  const [city, setCity] = useState(user.city || "");
  const [district, setDistrict] = useState(user.district || "");
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    // Ambil data provinsi
    fetchProvinces().then(() => {
      if (user.province) {
        setProvince(user.province);
        fetchCities(user.province).then(() => {
          if (user.city) {
            setCity(user.city);
            fetchSubdistricts(user.city).then(() => {
              if (user.district) {
                setDistrict(user.district);
              }
            });
          }
        });
      }
    });
  }, [user.province, user.city, user.district]);

  const fetchProvinces = async () => {
    const response = await fetch("/api?type=provinces");
    const data = await response.json();
    setProvinces(data);
  };

  const fetchCities = async (provinceId) => {
    const response = await fetch(`/api?type=cities&province_id=${provinceId}`);
    const data = await response.json();
    setCities(data);
  };

  const fetchSubdistricts = async (cityId) => {
    const response = await fetch(`/api?type=subdistricts&city_id=${cityId}`);
    const data = await response.json();
    setSubdistricts(data);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const formData = new URLSearchParams();
    formData.append("id", user.id);
    formData.append("username", username);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("name", name);
    formData.append("address", address);
    formData.append("province", province);
    formData.append("city", city);
    formData.append("district", district);

    try {
      const response = await fetch("/api/account", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      const result = await response.json();
      toast.success("Data berhasil disimpan!", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      navigate(-1);
    } catch (error) {
      toast.success("Data berhasil disimpan!", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <ToastContainer />

      <header className="sticky top-0 z-10 flex items-center justify-between border-b pb-2 lg:pb-4 mb-4 lg:mb-6 w-full px-4 lg:px-8 bg-white pt-4">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 lg:w-10 lg:h-10 bg-yellow-300 rounded-full flex items-center justify-center"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-xl lg:text-2xl font-bold">
          Kelola Akun
        </h1>
      </header>

      <main className="mr-4 ml-4">
        <Form method="post" onSubmit={handleSubmit}>
          <input type="hidden" name="id" value={user.id} />
          <div className="flex justify-center mb-4">
            <div className="bg-white w-14 h-14 rounded-full flex items-center justify-center">
              <i className="fas fa-user-circle text-7xl text-gray-300"></i>
            </div>
          </div>

          <div className="mb-4">
            <label className="block font-bold mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-200 p-2 rounded w-full"
            />
          </div>
          <div className="mb-4">
            <label className="block font-bold mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-200 p-2 rounded w-full"
            />
          </div>
          <div className="mb-4">
            <label className="block font-bold mb-1">No.Handphone</label>
            <input
              type="text"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-gray-200 p-2 rounded w-full"
            />
          </div>
          <div className="mb-4">
            <label className="block font-bold mb-1">Nama Lengkap</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-200 p-2 rounded w-full"
            />
          </div>
          <div className="mb-4">
            <label className="block font-bold mb-1">Provinsi</label>
            <select
              name="province"
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                fetchCities(e.target.value);
              }}
              className="bg-gray-200 p-2 rounded w-full"
            >
              <option value="">Pilih Provinsi</option>
              {provinces.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block font-bold mb-1">Kota</label>
            <select
              name="city"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                fetchSubdistricts(e.target.value);
              }}
              className="bg-gray-200 p-2 rounded w-full"
            >
              <option value="">Pilih Kota</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block font-bold mb-1">Kecamatan</label>
            <select
              name="district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="bg-gray-200 p-2 rounded w-full"
            >
              <option value="">Pilih Kecamatan</option>
              {subdistricts.map((subdistrict) => (
                <option key={subdistrict.id} value={subdistrict.id}>
                  {subdistrict.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block font-bold mb-1">Alamat</label>
            <input
              type="text"
              name="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-gray-200 p-2 rounded w-full"
            />
          </div>
          <div className="flex justify-center">
            <button className="w-full p-3 bg-yellow-300 text-black font-bold rounded shadow-md hover:bg-yellow-400">
              Simpan
            </button>
          </div>
        </Form>
      </main>
    </div>
  );
};

export default KelolaAkunPage;
