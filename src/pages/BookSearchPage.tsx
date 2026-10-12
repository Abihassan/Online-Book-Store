// src/pages/BookSearchPage.tsx
// Full-page wrapper for the LibGen book search feature.
// Route: /search  (add to App.tsx — see below)

import BookSearch from '../components/BookSearch';

export default function BookSearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <BookSearch fullPage />
    </div>
  );
}
