export const collectionSlugPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

const vietnameseMap: Record<string, string> = {
  đ: "d",
  Đ: "d",
};

export function slugifyCollectionName(value: string) {
  const normalized = value
    .replace(/[đĐ]/g, (char) => vietnameseMap[char] ?? char)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/[-_]{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");

  return normalized.slice(0, 80);
}

export function isValidCollectionSlug(value: string) {
  return value.length >= 3 && value.length <= 80 && collectionSlugPattern.test(value);
}

export function isStarterCollectionId(value: string) {
  return value.startsWith("starter-");
}

export function getCollectionDetailHref(locale: string, collectionId: string, slug: string) {
  return isStarterCollectionId(collectionId) ? null : `/${locale}/dashboard/collections/${slug}`;
}
