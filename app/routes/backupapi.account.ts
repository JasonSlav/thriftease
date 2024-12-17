import { json, ActionFunction } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import { authenticator } from "~/utils/auth.server";

const prisma = new PrismaClient();
export const action: ActionFunction = async ({ request }) => {
    const formData = new URLSearchParams(await request.text());
    const user = await authenticator.isAuthenticated(request);
    if (!user) {
        return null
    }

    const userId = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true },
    });

    if (!userId) {
        return json({ error: "ID user tidak ditemukan" }, { status: 400 });
    }

    const username = formData.get("username");
    const email = formData.get("email");
    const phoneNumber = formData.get("phone");
    const fullName = formData.get("name");
    const province = formData.get("province");
    const city = formData.get("city");
    const district = formData.get("subdistrict");
    const address = formData.get("address");

    if (!username) {
        return json({ error: "Username wajib diisi" }, { status: 400 });
    }

    if (!email) {
        return json({ error: "Email wajib diisi" }, { status: 400 });
    }

    if (!phoneNumber) {
        return json({ error: "Nomor telepon wajib diisi" }, { status: 400 });
    }

    if (!fullName) {
        return json({ error: "Nama lengkap wajib diisi" }, { status: 400 });
    }

    if (!province) {
        return json({ error: "Provinsi wajib diisi" }, { status: 400 });
    }

    if (!city) {
        return json({ error: "Kota wajib diisi" }, { status: 400 });
    }

    if (!district) {
        return json({ error: "Kecamatan wajib diisi" }, { status: 400 });
    }

    if (!address) {
        return json({ error: "Alamat wajib diisi" }, { status: 400 });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId.id },
            data: { username, fullName, email, phoneNumber, province, city, district, address },
        });

        return json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
        console.error(error);
        return json({ error: "Failed to update user" }, { status: 500 });
    }
};