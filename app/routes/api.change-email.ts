import { ActionFunction, json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import { sendEmail } from "~/utils/email.server"; // Fungsi untuk mengirim email
import { createToken } from "~/utils/token.server"; // Token JWT utilitas

const prisma = new PrismaClient();

export const action: ActionFunction = async ({ request }) => {
  const formData = new URLSearchParams(await request.text());
  const oldEmail = formData.get("email");

  if (!oldEmail) {
    return json({ error: "Email lama diperlukan" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: oldEmail },
  });

  if (!user) {
    return json({ error: "Email tidak ditemukan" }, { status: 404 });
  }

  const token = createToken({ userId: user.id }, "1h"); // Token berlaku 1 jam
  const updateLink = `${process.env.BASE_URL}/update-email?token=${token}`;

  await sendEmail({
    to: oldEmail,
    subject: "ThriftEase - Tautan Ganti Email",
    html: `<p>Klik <a href="${updateLink}">tautan ini</a> untuk mengganti email Anda.</p>
          <p>Link ini akan kadaluarsa dalam waktu 1 jam.</p>
          <p>Jika Anda tidak meminta penggantian email, abaikan email ini.</p>`,
  });

  return json({ message: "Tautan penggantian email telah dikirim." });
};
