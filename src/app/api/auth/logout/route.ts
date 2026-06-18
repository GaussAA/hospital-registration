import { NextResponse } from "next/server";
import { success } from "@/shared/utils/response";

export async function POST() {
  const response = NextResponse.json(success(null, "已登出"), { status: 200 });
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
