import jwt from "jsonwebtoken";
import { authenticator } from "./auth.server";
import { ActionFunction, json } from "@remix-run/node";

export const action: ActionFunction = async ({ request }) => {
    const userId = await authenticator.isAuthenticated(request);

    if (!userId) {
        return json("Pengguna tidak terautentikasi");
    }

    const token = createToken(userId, '1h');
    return { token };
};

export const createToken = (userId: object, expiresIn: string): string => {
    const payload = { userId };
    return jwt.sign(payload, process.env.JWT_SECRET_KEY!, { expiresIn });
};

export const verifyToken = (token: string): any => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET_KEY!);
    } catch (err) {
        return json("Token tidak valid atau sudah kedaluwarsa");
    }
};