import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BookImageGalleryProps {
  images: string[];
  bookTitle: string;
}

export const BookImageGallery = ({ images, bookTitle }: BookImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState(0);

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative rounded-lg overflow-hidden bg-slate-950 shadow-2xl shadow-orange-500/20
          w-[180px] h-[270px]       /* Mobile default */
          sm:w-[250px] sm:h-[375px] /* Tablet >=640px */
          lg:w-[720px] lg:h-[480px] /* Desktop >=1024px */
          mx-auto">
        <img
          src={images[selectedImage]}
          alt={`${bookTitle} - Image ${selectedImage + 1}`}
          className="w-full h-full object-contain"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Images */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`flex-shrink-0 w-28 h-32 rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === index
                  ? 'border-orange-500 shadow-lg shadow-orange-500/50'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <img
                src={image}
                alt={`${bookTitle} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};