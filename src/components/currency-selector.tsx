import React, { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface CurrencyPrice {
  currency: string;
  price: number;
  date: string;
}

interface CurrencySelectorProps {
  label: string;
  isOpen: boolean;
  selectedCurrency: string;
  availableCurrencies: CurrencyPrice[];
  setIsOpen: (isOpen: boolean) => void;
  onSelect: (currency: string) => void;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ selectedCurrency, onSelect, availableCurrencies, isOpen, setIsOpen, label }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside as EventListener);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside as EventListener);
    };
  }, [setIsOpen]);

  const filteredCurrencies = availableCurrencies.filter((c: CurrencyPrice) =>
    c.currency.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center justify-between min-w-full px-4 py-2 text-lg font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 ease-in-out"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center">
          {selectedCurrency || label}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto animate-fade-in">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search currency..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>
          <ul className="py-1">
            {filteredCurrencies.length > 0 ? (
              filteredCurrencies.map((currency: CurrencyPrice) => (
                <li
                  key={currency.currency}
                  className={`flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-blue-100 ${selectedCurrency === currency.currency ? 'bg-blue-50 font-medium' : ''}`}
                  onClick={() => {
                    onSelect(currency.currency);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  aria-selected={selectedCurrency === currency.currency}
                >
                  <span>{currency.currency}</span>
                  {selectedCurrency === currency.currency && <Check className="w-5 h-5 text-blue-600" />}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-gray-500">No currencies found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};