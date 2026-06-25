import { X, Trash2 } from 'lucide-react';
import { Bookmark } from '../lib/types';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

interface BookmarkPanelProps {
  bookmarks: Bookmark[];
  currentPage: number;
  onBookmarkClick: (page: number) => void;
  onBookmarkDelete: (bookmarkId: string) => void;
  onClose: () => void;
}

export const BookmarkPanel = ({
  bookmarks,
  currentPage,
  onBookmarkClick,
  onBookmarkDelete,
  onClose,
}: BookmarkPanelProps) => {
  const sortedBookmarks = [...bookmarks].sort((a, b) => a.page - b.page);

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-white">Bookmarks</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-400 hover:text-white hover:bg-gray-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {sortedBookmarks.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No bookmarks yet.
              <br />
              Click the bookmark icon to add one.
            </div>
          ) : (
            sortedBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  bookmark.page === currentPage
                    ? 'bg-amber-500/20 border-amber-500'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
                onClick={() => onBookmarkClick(bookmark.page)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      Page {bookmark.page}
                    </div>
                    {bookmark.note && (
                      <div className="text-xs text-gray-400 mt-1">
                        {bookmark.note}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(bookmark.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookmarkDelete(bookmark.id);
                    }}
                    className="text-gray-400 hover:text-red-400 hover:bg-gray-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};