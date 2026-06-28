import React, { createContext, useContext, useState, useEffect } from 'react';

const CURRENCIES = [
  { code: 'USD', symbol: '$',  label: 'USD',  flag: '🇺🇸' },
  { code: 'INR', symbol: '₹',  label: 'INR',  flag: '🇮🇳' },
  { code: 'NPR', symbol: 'Rs.', label: 'NPR', flag: '🇳🇵' },
];

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const [currencyCode, setCurrencyCode] = useState(() => {
    return localStorage.getItem('qr_currency') || 'USD';
  });

  useEffect(() => {
    localStorage.setItem('qr_currency', currencyCode);
  }, [currencyCode]);

  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];

  const formatPrice = (amount) => {
    const num = parseFloat(amount || 0);
    if (currencyCode === 'NPR') {
      return `Rs. ${num.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (currencyCode === 'INR') {
      return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${num.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, currencyCode, setCurrencyCode, currencies: CURRENCIES, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within a CurrencyProvider');
  return context;
};
