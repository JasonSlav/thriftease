import { Authenticator } from "remix-auth";
import { sessionStorage } from "./session.server";
import { FormStrategy } from "remix-auth-form";
import { GoogleStrategy } from "remix-auth-google";
import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN"
}

// Define User type with proper typing
type User = {
    id: string;
    email: string;
    name: string; // Changed from 'any' to 'string'
    role: UserRole;
};

export const authenticator = new Authenticator<User>(sessionStorage);

// Form Strategy for username/password login
authenticator.use(
    new FormStrategy(async ({ form }) => {
        const login = form.get("login") as string;
        if (!login) {
            throw new Error("Email/Username is required");
        }
        
        const password = form.get("password") as string;
        if (!password) {
            throw new Error("Password is required");
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: login },
                    { username: login }
                ]
            }
        });

        if (!user) {
            throw new Error("User not found");
        }

        // Check password
        if (user.password) {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                throw new Error("Invalid password");
            }
        }

        // Return object that matches User type
        return {
            id: user.id,
            email: user.email,
            name: user.username || user.fullName || user.email, // Use available name field
            role: user.role as UserRole
        };
    }),
    "form"
);

// Google Strategy for OAuth
authenticator.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: process.env.NODE_ENV === "production" 
                ? `${process.env.BASE_URL}/auth/google/callback`
                : "http://localhost:5173/auth/google/callback",
        },
        async ({ profile }) => {
            // Generate username from email or display name
            const baseUsername = profile.displayName
                .toLowerCase()
                .replace(/\s+/g, '')
                .slice(0, 15);

            // Check existing username and add random number if needed
            let username = baseUsername;
            let counter = 1;
            
            while (await prisma.user.findUnique({ where: { username } })) {
                username = `${baseUsername}${counter}`;
                counter++;
            }

            const user = await prisma.user.upsert({
                where: { email: profile.emails[0].value },
                update: {
                    // Update last login or other fields if needed
                    fullName: profile.displayName,
                },
                create: {
                    email: profile.emails[0].value,
                    username,
                    fullName: profile.displayName,
                    password: "", // No password for OAuth users
                    role: UserRole.USER,
                    province: "",
                    city: "",
                    district: "",
                    postalCode: "",
                    address: "",
                    phoneNumber: "",
                    isVerified: true
                },
            });

            // Return object that matches User type
            return {
                id: user.id,
                email: user.email,
                name: user.fullName || user.username, // Use fullName as name
                role: user.role as UserRole
            };
        }
    ),
    "google"
);

// Helper function to get user by session
export async function getUserById(id: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                username: true,
                fullName: true,
                role: true,
                isVerified: true
            }
        });

        if (!user) return null;

        return {
            id: user.id,
            email: user.email,
            name: user.fullName || user.username,
            role: user.role as UserRole
        };
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
}

// Helper function for type-safe user authentication
export async function requireAuth(request: Request): Promise<User> {
    const user = await authenticator.isAuthenticated(request);
    if (!user) {
        throw new Response("Unauthorized", { status: 401 });
    }
    return user;
}

// Helper function for admin-only routes
export async function requireAdmin(request: Request): Promise<User> {
    const user = await requireAuth(request);
    if (user.role !== UserRole.ADMIN) {
        throw new Response("Forbidden", { status: 403 });
    }
    return user;
}
