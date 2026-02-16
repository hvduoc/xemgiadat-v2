/**
 * SearchBar Component
 * Floating search input with dropdown results
 * 
 * Integration:
 * - Uses SearchService to search parcels
 * - Uses MapController to fly to selected parcel
 * - Handles fuzzy search formats (33 48, 33:48, etc.)
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { LandParcel } from '@/types';
import { searchService } from '@/services/SearchService';
import { mapController } from '@/services/MapController';

interface SearchBarProps {
  onParcelSelect?: (parcel: LandParcel) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onParcelSelect,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LandParcel[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Handle search input change with debounce
   */
  const handleInputChange = async (value: string) => {
    setQuery(value);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim()) {
      setResults([]);
      setIsDropdownOpen(false);
      return;
    }

    // Debounce: wait 300ms before searching
    setIsSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const searchResults = await searchService.search(value);
        setResults(searchResults);
        setIsDropdownOpen(true);
        console.log(`[SearchBar] Found ${searchResults.length} results for: "${value}"`);
      } catch (error) {
        console.error('[SearchBar] Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  /**
   * Handle parcel selection
   */
  const handleSelectParcel = async (parcel: LandParcel) => {
    console.log('[SearchBar] Parcel selected:', parcel.id);

    // Fly to parcel on map
    try {
      if (mapController.isReady()) {
        console.log('[SearchBar] Flying to coordinates:', parcel.coordinates, 'zoom: 18');
        mapController.flyTo(parcel.coordinates, 18);
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('parcel:selected', { detail: parcel }));
        console.log('[SearchBar] ✓ Dispatched parcel:selected event');
      }
    } catch (error) {
      console.warn('[SearchBar] Error navigating to parcel:', error);
    }

    // Callback to parent
    if (onParcelSelect) {
      onParcelSelect(parcel);
    }

    // Clear search
    setQuery('');
    setResults([]);
    setIsDropdownOpen(false);

    console.log('[SearchBar] ✓ Selection complete');
  };

  /**
   * Handle clear button
   */
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsDropdownOpen(false);
    searchInputRef.current?.focus();
  };

  /**
   * Close dropdown on click outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Cleanup timer on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`absolute top-4 left-4 z-10 ${className}`}>
      {/* Search Input Container */}
      <div className="relative w-96">
        {/* Input Field */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search className="w-5 h-5" />
          </div>

          <input
            ref={searchInputRef}
            type="text"
            placeholder="Tìm kiếm thửa đất (VD: 33 48, 34:10)..."
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => query && setIsDropdownOpen(true)}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-lg 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         bg-white text-gray-900 placeholder-gray-500 transition-all"
            data-testid="search-input"
          />

          {/* Clear Button */}
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 
                       hover:text-gray-700 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Loading Spinner */}
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          )}
        </div>

        {/* Results Dropdown */}
        {isDropdownOpen && (
          <div
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 
                       rounded-lg shadow-xl max-h-96 overflow-y-auto"
            data-testid="search-results"
          >
            {results.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-gray-500 text-sm">
                  {isSearching ? 'Đang tìm kiếm...' : 'Không tìm thấy kết quả'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {results.map((parcel) => (
                  <li key={parcel.id}>
                    <button
                      onClick={() => handleSelectParcel(parcel)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors 
                               focus:outline-none focus:bg-blue-100"
                      type="button"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            Tờ {parcel.so_to} - Thửa {parcel.so_thua}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {parcel.dia_chi}
                          </p>
                          <div className="flex gap-3 mt-2 text-xs">
                            <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                              {parcel.dien_tich}m²
                            </span>
                            <span className="px-2 py-1 bg-blue-100 rounded text-blue-700">
                              {parcel.loai_dat}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-500 mt-2">
        Nhập số tờ và số thửa cách nhau bằng khoảng trắng hoặc dấu hai chấm
      </p>
    </div>
  );
};

export default SearchBar;
