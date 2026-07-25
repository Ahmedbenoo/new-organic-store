import { readdir } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdminClient } from "@/lib/supabase";

const BUCKET = "products";
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const IMAGE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function isImageFile(name: string) {
  return IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase());
}

function getClient() {
  return getSupabaseAdminClient();
}

function getSupabasePublicBaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }
  return url;
}

function buildPublicUrl(storagePath: string) {
  const encodedPath = storagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${getSupabasePublicBaseUrl()}/storage/v1/object/public/${BUCKET}/${encodedPath}`;
}

function urlToStoragePath(url: string): string | null {
  const publicPrefix = `/storage/v1/object/public/${BUCKET}/`;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const parsed = new URL(url);
      const index = parsed.pathname.indexOf(publicPrefix);
      if (index === -1) return null;
      return decodeURIComponent(parsed.pathname.slice(index + publicPrefix.length));
    } catch {
      return null;
    }
  }

  if (url.startsWith(publicPrefix)) {
    return decodeURIComponent(url.slice(publicPrefix.length));
  }

  return null;
}

async function collectImagesFromDir(publicUrlPrefix: string, absoluteDir: string) {
  const urls: string[] = [];

  try {
    const entries = await readdir(absoluteDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && isImageFile(entry.name)) {
        urls.push(`${publicUrlPrefix}/${entry.name}`);
      }
    }
  } catch {
    return urls;
  }

  return urls;
}

async function listLegacyLocalImages() {
  const publicDir = path.join(process.cwd(), "public");
  const [assets, optimized] = await Promise.all([
    collectImagesFromDir("/assets", path.join(publicDir, "assets")),
    collectImagesFromDir("/optimized", path.join(publicDir, "optimized")),
  ]);

  return [...assets, ...optimized];
}

async function listStorageImages() {
  const supabase = getClient();
  const { data, error } = await supabase.storage.from(BUCKET).list("", {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) {
    throw new Error(`Failed to list storage images: ${error.message}`);
  }

  return (data ?? [])
    .filter((file) => file.name && !file.name.endsWith("/") && isImageFile(file.name))
    .map((file) => buildPublicUrl(file.name));
}

export async function listMediaImages() {
  const [storageImages, legacyImages] = await Promise.all([
    listStorageImages(),
    listLegacyLocalImages(),
  ]);

  return [...storageImages, ...legacyImages].sort((a, b) => a.localeCompare(b));
}

export async function saveUploadedImage(file: File) {
  const extension = path.extname(file.name).toLowerCase();

  if (!IMAGE_EXTENSIONS.has(extension)) {
    throw new Error("Unsupported image type");
  }

  if (file.type && !IMAGE_CONTENT_TYPES.has(file.type)) {
    throw new Error("Unsupported image type");
  }

  const safeBase = path
    .basename(file.name, extension)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 60);
  const filename = `${Date.now()}-${safeBase}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";

  const { error } = await getClient()
    .storage.from(BUCKET)
    .upload(filename, buffer, {
      contentType,
      upsert: false,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  return buildPublicUrl(filename);
}

export async function deleteUploadedImage(url: string) {
  const storagePath = urlToStoragePath(url);

  if (!storagePath) {
    throw new Error("Only Supabase Storage URLs can be deleted");
  }

  const { error } = await getClient().storage.from(BUCKET).remove([storagePath]);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}
