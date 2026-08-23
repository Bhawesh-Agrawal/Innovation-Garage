import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });

  // Clear HttpOnly cookie
  response.cookies.set({
    name: "sih_auth_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0 // Expire immediately
  });

  return response;
}
