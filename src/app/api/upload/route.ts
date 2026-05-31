import { NextRequest, NextResponse } from "next/server";
import { fail } from "@/lib/utils/response";

/**
 * POST /api/upload — P0 stub.
 *
 * File upload functionality will be provided in a future version.
 * P0 MVP does not include image upload support.
 */
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    fail(50100, "文件上传功能将在后续版本提供"),
    { status: 501 }
  );
}
