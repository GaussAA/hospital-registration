import { NextRequest, NextResponse } from "next/server";
import { ConversationStore } from "@/lib/ai/conversation-store";
import { fail } from "@/lib/utils/response";

/**
 * GET /api/conversations/[id]/export
 *
 * Export a conversation as a Markdown file for download.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const detail = await ConversationStore.getDetail(id);

    if (!detail) {
      return NextResponse.json(fail(40400, "对话不存在"), { status: 404 });
    }

    const markdown = generateMarkdown(detail);
    const fileName = `对话记录_${detail.title.replace(/[\\/:*?"<>|]/g, "_")}_${new Date().toISOString().slice(0, 10)}.md`;

    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    console.error("[conversations/export] Error:", error);
    return NextResponse.json(fail(50000, "导出失败"), { status: 500 });
  }
}

/**
 * Convert a conversation to Markdown format.
 */
function generateMarkdown(detail: {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: string;
    content: string | null;
    toolCalls: string | null;
    reasoningContent: string | null;
    createdAt: string;
    toolCallRecords?: Array<{
      id: string;
      toolName: string;
      arguments: string;
      result: string | null;
      status: string;
    }>;
  }>;
}): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${detail.title}`);
  lines.push("");
  lines.push(`> 导出时间：${new Date().toLocaleString("zh-CN")}`);
  lines.push(`> 对话 ID：\`${detail.id}\``);
  lines.push(`> 消息数：${detail.messages.length} 条`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Messages
  for (const msg of detail.messages) {
    const time = new Date(msg.createdAt).toLocaleString("zh-CN");
    const roleLabel = getRoleLabel(msg.role);

    // Header
    lines.push(`### ${roleLabel} — ${time}`);
    lines.push("");

    // Content
    if (msg.content) {
      if (msg.role === "assistant" || msg.role === "user") {
        lines.push(msg.content);
      } else {
        lines.push("```");
        lines.push(msg.content);
        lines.push("```");
      }
    } else {
      lines.push("*（无内容）*");
    }

    // Tool calls info (from toolCallRecords or legacy toolCalls)
    const records = msg.toolCallRecords;
    if (msg.role === "assistant" && records && records.length > 0) {
      lines.push("");
      lines.push("**调用的工具：**");
      for (const tc of records) {
        lines.push(`- \`${tc.toolName}(${tc.arguments})\``);
      }
    }

    // Reasoning/thinking content
    if (msg.role === "assistant" && msg.reasoningContent) {
      lines.push("");
      lines.push("<details>");
      lines.push("<summary><strong>思考过程</strong></summary>");
      lines.push("");
      lines.push(msg.reasoningContent);
      lines.push("");
      lines.push("</details>");
    }

    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // Footer
  lines.push(`*由 健康挂号 AI 助手 导出*`);

  return lines.join("\n");
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "user":
      return "👤 用户";
    case "assistant":
      return "🤖 AI 助手";
    case "tool":
      return "🔧 系统工具";
    default:
      return `📄 ${role}`;
  }
}
