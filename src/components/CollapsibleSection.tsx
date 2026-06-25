import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const CollapsibleSection = ({
  title,
  children,
  defaultOpen = false
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full
          flex
          items-center
          justify-between
          py-4
          text-left
          px-4
          rounded-lg
          bg-transparent
          hover:bg-transparent
          transition-none
        "
      >
        {/* TITLE — now black */}
        <h3 className="text-lg font-semibold text-black">
          {title}
        </h3>

        {/* ICON — now black */}
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-black" />
        ) : (
          <ChevronDown className="w-5 h-5 text-black" />
        )}
      </button>

      {isOpen && (
        <div className="pb-4 px-4 text-black">
          {children}
        </div>
      )}
    </div>
  );
};
