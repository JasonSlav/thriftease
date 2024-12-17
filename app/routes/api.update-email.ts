import { ActionFunction, redirect, json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "~/utils/token.server";

const prisma = new PrismaClient();

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const token = formData.get("token");

  if (typeof email !== "string" || typeof token !== "string") {
    return json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const payload = verifyToken(token);
    if (!payload || typeof payload.userId !== "string") {
      return json("Invalid token");
    }

    const userId = payload.userId;

    // Check if the email is already used
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return json({ error: "Email sudah digunakan" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { email },
    });

    // Redirect to success page
    return redirect("/success-updateemail");
  } catch (error) {
    console.error("Error updating email:", error);
    return json({ error: "Token tidak valid atau sudah kadaluarsa" }, { status: 400 });
  }
};