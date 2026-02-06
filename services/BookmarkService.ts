/**
 * BookmarkService - Manages saved/bookmarked listings using LocalStorage
 */
class BookmarkService {
  private static readonly STORAGE_KEY = 'xemgiadat_bookmarks';

  /**
   * Get all bookmarked listings
   */
  static getBookmarks(): string[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('[BookmarkService] Failed to get bookmarks:', err);
      return [];
    }
  }

  /**
   * Check if a listing is bookmarked
   */
  static isBookmarked(listingId: string): boolean {
    try {
      const bookmarks = this.getBookmarks();
      return bookmarks.includes(listingId);
    } catch (err) {
      console.error('[BookmarkService] Failed to check bookmark:', err);
      return false;
    }
  }

  /**
   * Add a listing to bookmarks
   */
  static addBookmark(listingId: string): boolean {
    try {
      const bookmarks = this.getBookmarks();
      if (!bookmarks.includes(listingId)) {
        bookmarks.push(listingId);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookmarks));
        console.log('[BookmarkService] ✅ Bookmark added:', listingId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[BookmarkService] Failed to add bookmark:', err);
      return false;
    }
  }

  /**
   * Remove a listing from bookmarks
   */
  static removeBookmark(listingId: string): boolean {
    try {
      const bookmarks = this.getBookmarks();
      const index = bookmarks.indexOf(listingId);
      if (index > -1) {
        bookmarks.splice(index, 1);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookmarks));
        console.log('[BookmarkService] 🗑️ Bookmark removed:', listingId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[BookmarkService] Failed to remove bookmark:', err);
      return false;
    }
  }

  /**
   * Toggle bookmark status
   */
  static toggleBookmark(listingId: string): boolean {
    const isBookmarked = this.isBookmarked(listingId);
    if (isBookmarked) {
      this.removeBookmark(listingId);
    } else {
      this.addBookmark(listingId);
    }
    return !isBookmarked;
  }

  /**
   * Clear all bookmarks
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('[BookmarkService] 🗑️ All bookmarks cleared');
    } catch (err) {
      console.error('[BookmarkService] Failed to clear bookmarks:', err);
    }
  }

  /**
   * Get bookmark count
   */
  static getCount(): number {
    return this.getBookmarks().length;
  }
}

(window as any).BookmarkService = BookmarkService;
