import { writeFile, mkdir, unlink, stat } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ASSETS_DIR = join(process.cwd(), "public", "assets", "profiles");

export async function ensureAssetsDir(): Promise<void> {
  if (!existsSync(ASSETS_DIR)) {
    await mkdir(ASSETS_DIR, { recursive: true });
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size must be less than 5MB" };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Only JPEG, PNG, and WebP images are allowed"
    };
  }

  return { valid: true };
}

export async function saveProfilePicture(
  userId: string,
  file: File
): Promise<string> {
  await ensureAssetsDir();

  // Generate unique filename
  const extension = file.name.split(".").pop() || "jpg";
  const filename = `profile-${userId}-${Date.now()}.${extension}`;
  const filepath = join(ASSETS_DIR, filename);

  // Convert File to Buffer and save
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await writeFile(filepath, buffer);

  // Return the public URL path
  return `/assets/profiles/${filename}`;
}

export async function deleteProfilePicture(profilePictureUrl: string): Promise<void> {
  if (!profilePictureUrl) {
    return;
  }

  // Extract filename from URL
  const filename = profilePictureUrl.split("/").pop();
  if (!filename) {
    return;
  }

  const filepath = join(ASSETS_DIR, filename);

  // Check if file exists and delete
  try {
    if (existsSync(filepath)) {
      await unlink(filepath);
    }
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    // Don't throw - file might already be deleted
  }
}


