import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json(
      {
        message: "Logout successful",
      },
      {
        status: 200,
      }
    );

    response.cookies.set({
      name: "auth_token",
      value: "",
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      maxAge: 0,
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(
      "Logout error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to logout",
      },
      {
        status: 500,
      }
    );
  }
}