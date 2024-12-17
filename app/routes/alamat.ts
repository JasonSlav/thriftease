import { LoaderFunction, json, redirect } from '@remix-run/node';
import { authenticator } from '~/utils/auth.server';
import { PrismaClient } from '@prisma/client'
import axios from 'axios';

const prisma = new PrismaClient();
export const loader: LoaderFunction = async ({ request }) => {
    const user = await authenticator.isAuthenticated(request);
    if (!user) {
        return redirect('/login');
    }

    // Ambil data lokasi user dari database
    const location = await prisma.user.findUnique({
        where: {
            id: user.id,
        },
        select: {
            province: true,
            city: true,
            district: true,
        },
    });

    if (!location) {
        return json({ error: 'User location not found' }, { status: 404 });
    }

    const { province, city, district } = location;

    try {
        // Ambil data dari API secara paralel
        const provincePromise = axios.get('https://jasonslav.github.io/api-wilayah-indonesia/api/provinces.json');
        const cityPromise = axios.get(`https://jasonslav.github.io/api-wilayah-indonesia/api/regencies/${province}.json`);
        const districtPromise = axios.get(`https://jasonslav.github.io/api-wilayah-indonesia/api/districts/${city}.json`);

        const [provinceResponse, cityResponse, districtResponse] = await Promise.all([
            provincePromise,
            cityPromise,
            districtPromise,
        ]);

        // Temukan nama lokasi berdasarkan ID
        const provinceName = provinceResponse.data.find((item: any) => item.id === province)?.name || null;
        const cityName = cityResponse.data.find((item: any) => item.id === city)?.name || null;
        const districtName = districtResponse.data.find((item: any) => item.id === district)?.name || null;

        return json({
            user: user.id,
            location: {
                province: provinceName,
                city: cityName,
                district: districtName,
            },
        });
    } catch (error) {
        console.error('Error fetching location data:', error);
        return json({ error: 'Failed to fetch location data' }, { status: 500 });
    }
};