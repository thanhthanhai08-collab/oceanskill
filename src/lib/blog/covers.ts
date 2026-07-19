export const blogCoverBucket = "blog-assets";

export function blogCoverPublicUrl(path: string | null | undefined) {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${blogCoverBucket}/${encoded}`;
}
