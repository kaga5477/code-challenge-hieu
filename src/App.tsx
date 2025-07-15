import { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import { ArrowDownUp } from 'lucide-react';
import { CurrencySelector, type CurrencyPrice } from './components/currency-selector';

// Process raw data and get latest prices
const getLatestTokenPrices = (data: CurrencyPrice[]): CurrencyPrice[] => {
  const latestPrices = new Map<string, { price: number; date: string }>();

  data.forEach(item => {
    const existing = latestPrices.get(item.currency);
    const newItemDate = new Date(item.date);

    if (!existing || newItemDate > new Date(existing.date)) {
      latestPrices.set(item.currency, { price: item.price, date: item.date });
    }
  });

  // Convert map to array of objects for easier iteration in dropdowns
  return Array.from(latestPrices.entries()).map(([currency, data]) => ({
    currency,
    price: data.price,
    date: data.date
  }));
};

function App() {
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyPrice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // State for selected currencies and amounts
  const [fromCurrency, setFromCurrency] = useState<string>('');
  const [toCurrency, setToCurrency] = useState<string>('');
  const [fromAmount, setFromAmount] = useState<string>('1.0');
  const [toAmount, setToAmount] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [swapSuccess, setSwapSuccess] = useState<boolean>(false);

  // State for dropdown
  const [showFromDropdown, setShowFromDropdown] = useState<boolean>(false);
  const [showToDropdown, setShowToDropdown] = useState<boolean>(false);

  // Fetch data 
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const response = await fetch('https://interview.switcheo.com/prices.json');
        if (!response.ok) {
          throw new Error(`HTTP error status: ${response.status}`);
        }
        const data: CurrencyPrice[] = await response.json();
        const processedCurrencies = getLatestTokenPrices(data);
        setAvailableCurrencies(processedCurrencies);

        // Set initial currencies after data is fetched
        if (processedCurrencies.length > 0) {
          setFromCurrency(processedCurrencies[0].currency);
          if (processedCurrencies.length > 1) {
            setToCurrency(processedCurrencies[1].currency);
          } else {
            setToCurrency(processedCurrencies[0].currency); 
          }
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        setFetchError(`Failed to fetch currency data: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Memoize currency prices for efficient lookup
  const currencyPrices = useMemo(() => {
    const prices = new Map<string, number>();
    availableCurrencies.forEach(c => prices.set(c.currency, c.price));
    return prices;
  }, [availableCurrencies]);

  // Calculate exchange rate and toAmount whenever dependencies change
  useEffect(() => {
    setError(''); 
    setSwapSuccess(false); 

    const fromPrice = currencyPrices.get(fromCurrency);
    const toPrice = currencyPrices.get(toCurrency);

    if (fromPrice === undefined || toPrice === undefined) {
      setExchangeRate(null);
      setToAmount('');
      if (fromCurrency && toCurrency && !loading) { 
        setError('Exchange rate not available for selected currencies.');
      }
      return;
    }

    const rate = toPrice / fromPrice; 
    setExchangeRate(rate);

    const amount = parseFloat(fromAmount);
    if (!isNaN(amount) && amount > 0) {
      setToAmount((amount * rate).toFixed(6));
    } else {
      setToAmount('');
      setError('Please enter a valid amount to send.');
    }
  }, [fromCurrency, toCurrency, fromAmount, currencyPrices, loading]);

  // Handle amount input change
  const handleFromAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string, numbers, and a single decimal point
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setFromAmount(value);
    }
  };

  // Handle currency swap
  const handleCurrencySwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4 font-inter">
        <div className="text-white text-2xl font-bold">Loading currency data...</div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4 font-inter">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{fetchError}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4 font-inter">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md transform transition-all duration-300 hover:scale-105">
        <h1 className="text-3xl font-bold text-gray-800 mb-12 text-center">Currency Swap</h1>

        {/* Send Section */}
        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <label htmlFor="fromAmount" className="block text-sm font-medium text-gray-600 mb-2">Amount to send</label>
         <div className="flex flex-col items-start space-y-3">
            <input
              type="text"
              id="fromAmount"
              className="flex-grow p-2 text-2xl font-bold text-gray-900 bg-transparent focus:outline-none focus:ring-0"
              placeholder="0.0"
              value={fromAmount}
              onChange={handleFromAmountChange}
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
            />
            <CurrencySelector
              selectedCurrency={fromCurrency}
              onSelect={setFromCurrency}
              availableCurrencies={availableCurrencies}
              isOpen={showFromDropdown}
              setIsOpen={setShowFromDropdown}
              label="Select Currency"
            />
          </div>
        </div>

        {/* Swap Currencies Button */}
        <div className="flex justify-center m-4 relative">
          <button
            onClick={handleCurrencySwap}
            className="p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 ease-in-out transform hover:rotate-180"
            aria-label="Swap currencies"
          >
            <ArrowDownUp className="w-6 h-6" />
          </button>
        </div>

        {/* Receive Section */}
        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <label htmlFor="toAmount" className="block text-sm font-medium text-gray-600 mb-2">Amount to receive</label>
          <div className="flex flex-col items-start space-y-3">
            <input
              type="text"
              id="toAmount"
              className="flex-grow p-2 text-2xl font-bold text-gray-900 bg-transparent focus:outline-none focus:ring-0"
              placeholder="0.0"
              value={toAmount}
              readOnly
            />
            <CurrencySelector
              selectedCurrency={toCurrency}
              onSelect={setToCurrency}
              availableCurrencies={availableCurrencies}
              isOpen={showToDropdown}
              setIsOpen={setShowToDropdown}
              label="Select Currency"
            />
          </div>
        </div>

        {/* Exchange Rate and Error/Success Messages */}
        {exchangeRate !== null && fromCurrency && toCurrency && fromCurrency !== toCurrency && (
          <p className="text-center text-gray-700 text-sm mb-4">
            1 {fromCurrency} = {exchangeRate.toFixed(6)} {toCurrency}
          </p>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        {swapSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline ml-2">Swap initiated successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
