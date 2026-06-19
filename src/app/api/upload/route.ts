import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { success, fail } from "@/shared/utils/response";

/**
 * POST /api/upload — 上传文件（图片），保存到 public/uploads/。
 *
 * 支持：image/png, image/jpeg, image/webp, image/gif
 * 限制：单文件最大 10MB
 * 返回：{ url: "/uploads/xxx.jpg" } 可从前端直接访问
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(fail(40001, "请提供上传文件"), { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(fail(40002, "仅支持 PNG、JPEG、WebP、GIF 格式图片"), { status: 400 });
    }

    // 验证文件大小（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(fail(40003, "文件大小不能超过 10MB"), { status: 400 });
    }

    // 生成文件名
    const ext = file.type.split("/")[1] || "jpg";
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const fileName = `chat_${timestamp}_${random}.${ext}`;

    // 确保 uploads 目录存在
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // 写入文件
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    const url = `/uploads/${fileName}`;

    return NextResponse.json(success({ url }));
  } catch (error) {
    console.error("[upload] Error:", error);
    return NextResponse.json(fail(50000, "上传失败"), { status: 500 });
  }
}
