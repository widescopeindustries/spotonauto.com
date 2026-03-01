/**
 * Forum utility functions — slugify, timeAgo, generateThreadSlug
 */

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);
}

export function timeAgo(date: string | Date): string {
    const now = Date.now();
    const then = new Date(date).getTime();
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
}

export function generateThreadSlug(
    title: string,
    vehicleYear?: number,
    vehicleMake?: string,
    vehicleModel?: string
): string {
    const vehiclePrefix =
        vehicleYear && vehicleMake && vehicleModel
            ? `${vehicleYear}-${slugify(vehicleMake)}-${slugify(vehicleModel)}-`
            : '';
    return vehiclePrefix + slugify(title);
}

export function randomSuffix(): string {
    return Math.random().toString(36).slice(2, 6);
}
