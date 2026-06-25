import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './input';

/**
 * SegmentedPasswordInput
 * ──────────────────────
 * NOTE: despite the name (kept so Auth.tsx / Profile.tsx don't need any
 * import changes), this is now a NORMAL, continuously-typeable password
 * field — NOT a segmented/OTP-style box-per-character input.
 *
 * An earlier version of this component used an 8-box OTP-style layout.
 * In practice that meant focus only advanced one box at a time in a way
 * that felt like clicking before every letter, which made the field
 * frustrating to use — so it's been reverted to a standard single
 * <input type="password">, which types continuously like any normal
 * text field, supports real browser/OS password-manager autofill, and
 * has no fixed character-count ceiling.
 *
 * Password length validation also reverted to "at least 8 characters"
 * (see validation.ts and the backend's register/change-password checks)
 * now that there's no fixed-box UI constraining it to exactly 8.
 */

interface SegmentedPasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  autoFocus?: boolean;
  placeholder?: string;
}

export const SegmentedPasswordInput = ({
  id,
  value,
  onChange,
  error,
  label,
  autoFocus,
  placeholder,
}: SegmentedPasswordInputProps) => {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          placeholder={placeholder ?? '••••••••'}
          autoComplete="current-password"
          className="bg-orange-50 border-orange-200 text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:ring-orange-200 pr-10"
        />

        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};