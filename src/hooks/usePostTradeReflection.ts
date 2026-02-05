import { useState, useCallback } from 'react';

interface TradeData {
  allocationId?: string;
  journalEntryId?: string;
  symbol?: string;
  pnl?: number;
}

export function usePostTradeReflection() {
  const [isOpen, setIsOpen] = useState(false);
  const [tradeData, setTradeData] = useState<TradeData>({});

  const openReflection = useCallback((data: TradeData) => {
    setTradeData(data);
    setIsOpen(true);
  }, []);

  const closeReflection = useCallback(() => {
    setIsOpen(false);
    setTradeData({});
  }, []);

  return {
    isOpen,
    tradeData,
    openReflection,
    closeReflection,
    setIsOpen,
  };
}
