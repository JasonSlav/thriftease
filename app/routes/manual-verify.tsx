import { ActionFunction, redirect } from "@remix-run/node";
import { authenticator } from "~/utils/auth.server";
import { sendOTP } from "~/utils/jwt.server";

export const action: ActionFunction = async ({ request }) => {
    const user = await authenticator.isAuthenticated(request);

    if (!user) {
        return redirect("/login");
    }
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const { token, expiresIn } = await sendOTP(email);

    // Redirect ke halaman verifikasi OTP dengan token dan email di query string
    return redirect(`/verify-otp?token=${token}&email=${encodeURIComponent(email)}&expiresIn=${expiresIn}`);
}

const ManualVerify = () => {
    return (
        <div>
            <p>Anda belum terverifikasi. Silakan verifikasi melalui email.</p>
        </div>
    );
};

export default ManualVerify;