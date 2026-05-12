export const getPlainText = (value: string) => {
    if (!value) return "";
    // Convert HTML string to plain text
    return value
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .trim();
};