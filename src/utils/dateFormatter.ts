/**
 * Format timestamp to Vietnamese date format
 * @param timestamp - Unix timestamp in milliseconds, Date object, or Firestore Timestamp
 * @returns Formatted date string in Vietnamese
 */
export function formatDateVN(timestamp: Date | number | { toDate(): Date }): string {
  try {
    let date: Date;
    
    // Handle Firestore Timestamp object
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return 'N/A';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Vừa xong (today)
    if (diffDays === 0) {
      return 'Vừa xong';
    }

    // X ngày trước (< 7 days)
    if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    }

    // Otherwise, return day/month/year
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'N/A';
  }
}

/**
 * Check if listing is old (> 30 days)
 * @param timestamp - Unix timestamp in milliseconds, Date object, or Firestore Timestamp
 * @returns true if listing is older than 30 days
 */
export function isOldListing(timestamp: Date | number | { toDate(): Date }): boolean {
  try {
    let date: Date;
    
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return false;
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays > 30;
  } catch (error) {
    console.error('Date check error:', error);
    return false;
  }
}

// Make it available globally for vanilla JS usage
(window as any).DateFormatter = {
  formatDateVN,
  isOldListing
};
