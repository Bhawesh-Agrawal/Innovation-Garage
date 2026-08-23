import { NextResponse } from "next/server";
import { verifyGoogleToken } from "@/lib/verifyGoogleToken";

const ALLOWED_NITW_DOMAINS = ["nitw.ac.in", "student.nitw.ac.in"];

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split("; ").map((c) => {
      const i = c.indexOf("=");
      return [c.slice(0, i), c.slice(i + 1)];
    })
  );
}

export async function GET(req: Request) {
  try {
    const cookies = parseCookies(req.headers.get("cookie"));
    const idToken = cookies["sih_auth_token"];

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "No session found" },
        { status: 401 }
      );
    }

    // Dev bypass
    if (process.env.NODE_ENV === "development" && idToken === "dev_bypass_token") {
      return NextResponse.json({
        success: true,
        user: {
          name: "Dev User",
          email: "dev@nitw.ac.in",
          picture: "",
        },
      });
    }

    // Verify the token is still valid with Google
    const payload = await verifyGoogleToken(idToken);
    if (!payload) {
      // Token is invalid/expired — clear the cookie
      const response = NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 }
      );
      response.cookies.set({
        name: "sih_auth_token",
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    // Check token expiration
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds > payload.exp) {
      const response = NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 }
      );
      response.cookies.set({
        name: "sih_auth_token",
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    // Enforce NITW domain
    const emailDomain = payload.email.split("@")[1] || "";
    const hdClaim = payload.hd || emailDomain;
    const isNitwDomain =
      ALLOWED_NITW_DOMAINS.includes(emailDomain) || ALLOWED_NITW_DOMAINS.includes(hdClaim);

    if (!isNitwDomain) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        name: payload.name,
        email: payload.email,
        picture: payload.picture || "",
      },
    });
  } catch (error) {
    console.error("Session API Error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
