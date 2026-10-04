import { exportAccountData } from "@/lib/api/generated/account/account";

export type ExportFormat = "json" | "markdown";

function filenameFrom(headers: Headers, format: ExportFormat): string {
  const match = /filename="([^"]+)"/.exec(headers.get("content-disposition") ?? "");
  return match?.[1] ?? `life-manager-export.${format === "json" ? "json" : "md"}`;
}

// FR-017/FR-018: fetched through the API client (not a link) so errors such as
// 409 show in the page, then handed to the browser as a file download.
export async function downloadExport(format: ExportFormat): Promise<void> {
  const res = await exportAccountData({ format });
  const text = typeof res.data === "string" ? res.data : JSON.stringify(res.data, null, 2);
  const type = format === "json" ? "application/json" : "text/markdown";
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filenameFrom(res.headers, format);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
