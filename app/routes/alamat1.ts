import { json, ActionFunction, LoaderFunction } from '@remix-run/node';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { authenticator } from '~/utils/auth.server';

const prisma = new PrismaClient();

export const loader: LoaderFunction = async ({ request }) => {
    const user = await authenticator.isAuthenticated(request);
    console.log(user);
    return user;
}

export const action: ActionFunction = async ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
  
    if (!userId) {
      return json({ error: 'user_id is required' }, { status: 400 });
    }
  
    try {
      // Ambil data user dari database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { province: true, city: true, district: true },
      });
  
      if (!user) {
        return json({ error: 'User not found' }, { status: 404 });
      }
  
      const { province, city, district } = user;
  
      // Ambil data nama lokasi dari API
      const provincePromise = axios.get('https://jasonslav.github.io/api-wilayah-indonesia/api/provinces.json');
      const cityPromise = axios.get(`https://jasonslav.github.io/api-wilayah-indonesia/api/regencies/${province_id}.json`);
      const districtPromise = axios.get(`https://jasonslav.github.io/api-wilayah-indonesia/api/districts/${city_id}.json`);
  
      const [provinceResponse, cityResponse, districtResponse] = await Promise.all([
        provincePromise,
        cityPromise,
        districtPromise,
      ]);
  
      const provinceId = provinceResponse.data.find((item) => item.id === province);
      const cityId = cityResponse.data.find((item) => item.id === city);
      const districtId = districtResponse.data.find((item) => item.id === district);
  
      console.log(provinceId, cityId, districtId);
  
      return json({
        user_id: userId,
        province: province ? provinceId.name : null,
        city: city ? cityId.name : null,
        district: district ? districtId.name : null,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      return json({ error: 'Failed to fetch location data' }, { status: 500 });
    }
  };