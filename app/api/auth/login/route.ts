import { NextResponse } from "next/server";
import { verifyGoogleToken } from "@/lib/verifyGoogleToken";

const ALLOWED_NITW_DOMAINS = ["nitw.ac.in", "student.nitw.ac.in"];

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ success: false, error: "Missing idToken" }, { status: 400 });
    }

    // Dev bypass: skip Google verification in development
    if (process.env.NODE_ENV === "development" && idToken === "dev_bypass_token") {
      const response = NextResponse.json({ success: true }, { status: 200 });
      response.cookies.set({
        name: "sih_auth_token",
        value: idToken,
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        path: "/",
        maxAge: 3600,
      });
      return response;
    }

    // Verify token with Google (iss, aud, email_verified checks)
    const payload = await verifyGoogleToken(idToken);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token." },
        { status: 401 }
      );
    }

    // Enforce NITW domain
    const emailDomain = payload.email.split("@")[1] || "";
    const hdClaim = payload.hd || emailDomain;
    const isNitwDomain =
      ALLOWED_NITW_DOMAINS.includes(emailDomain) || ALLOWED_NITW_DOMAINS.includes(hdClaim);

    if (!isNitwDomain) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied. Only NITW email accounts are allowed.",
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json({ success: true }, { status: 200 });

    // Set HttpOnly cookie
    response.cookies.set({
      name: "sih_auth_token",
      value: idToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 3600, // 1 hour
    });

    return response;
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
