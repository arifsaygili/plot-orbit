/**
 * Slugify utility for generating URL-safe slugs from text
 */

const turkishCharMap: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

/**
 * Convert text to a URL-safe slug
 * - Converts Turkish characters
 * - Converts to lowercase
 * - Replaces spaces and special chars with hyphens
 * - Removes consecutive hyphens
 * - Trims hyphens from start/end
 */
export function slugify(text: string): string {
  if (!text) return "";

  let slug = text.toLowerCase();

  // Replace Turkish characters
  for (const [turkishChar, latinChar] of Object.entries(turkishCharMap)) {
    slug = slug.replace(new RegExp(turkishChar, "g"), latinChar);
  }

  // Replace spaces and non-alphanumeric chars with hyphens
  slug = slug
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-") // Remove consecutive hyphens
    .replace(/^-|-$/g, ""); // Trim hyphens from start/end

  return slug;
}

/**
 * Generate a random 3-digit suffix for slug uniqueness
 */
export function generateSlugSuffix(): string {
  return Math.floor(100 + Math.random() * 900).toString();
}

/**
 * Add a random suffix to make slug unique
 */
export function randomizeSlug(slug: string): string {
  // Remove existing numeric suffix if present (e.g., "my-org-123" -> "my-org")
  const baseSlug = slug.replace(/-\d{3}$/, "");
  return `${baseSlug}-${generateSlugSuffix()}`;
}

/**
 * Validate slug format
 * - Only lowercase letters, numbers, and hyphens
 * - 3-32 characters
 */
export function isValidSlug(slug: string): boolean {
  if (!slug) return false;
  if (slug.length < 3 || slug.length > 32) return false;
  return /^[a-z0-9-]+$/.test(slug);
}
