/**
 * Filename Generator for AI Isometric Icon Generator
 * Generates valid filenames from user prompts
 * Requirements: 6.3
 */

/**
 * Generates a valid filename from a prompt
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes special characters (keeps alphanumeric and hyphens)
 * - Appends .png extension
 * - Ensures filename is not empty (uses 'icon' as fallback)
 * - Limits length to prevent filesystem issues
 */
export function generateFilename(prompt: string): string {
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    return 'icon.png';
  }

  let filename = prompt
    // Convert to lowercase
    .toLowerCase()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove all characters except alphanumeric and hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Replace multiple consecutive hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length to 50 characters (before extension)
    .slice(0, 50);

  // Fallback if result is empty
  if (filename.length === 0) {
    filename = 'icon';
  }

  return `${filename}.png`;
}

/**
 * Validates that a filename is safe for all operating systems
 * - No reserved characters: < > : " / \ | ? *
 * - No reserved names (Windows): CON, PRN, AUX, NUL, COM1-9, LPT1-9
 * - Reasonable length
 */
export function isValidFilename(filename: string): boolean {
  if (typeof filename !== 'string' || filename.length === 0) {
    return false;
  }

  // Check for reserved characters
  const reservedChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (reservedChars.test(filename)) {
    return false;
  }

  // Check for Windows reserved names
  const reservedNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  if (reservedNames.test(nameWithoutExt)) {
    return false;
  }

  // Check length (max 255 for most filesystems)
  if (filename.length > 255) {
    return false;
  }

  return true;
}
