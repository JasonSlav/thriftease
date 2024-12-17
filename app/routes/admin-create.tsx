import { Form, useActionData, redirect } from "@remix-run/react";
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const action = async ({ request }) => {
  const formData = await request.formData();
  const username = formData.get("username");
  const email = formData.get("email");
  const password = formData.get("password");

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      role: "ADMIN",
      fullName: 'Admin',
      phoneNumber: '',
      isVerified: true,
      province: '1',
      city: '1',
      district: '1',
      postalCode: '1',
      address: '1',
    },
  });

  return redirect(`/`);
};

export default function CreateAdmin() {
  const actionData = useActionData();

  return (
    <div>
      <h1>Create Admin</h1>
      <Form method="post">
        <label>
          Username:
          <input type="text" name="username" required />
        </label>
        <label>
          Email:
          <input type="email" name="email" required />
        </label>
        <label>
          Password:
          <input type="password" name="password" required />
        </label>
        <button type="submit">Create Admin</button>
      </Form>
    </div>
  );
}