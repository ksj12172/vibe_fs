import { create } from "zustand";
import { persist } from "zustand/middleware";

// 주식 정보 타입 정의
export interface StockInfo {
  id: number;
  symbol: string;
  name: string;
  nameKor?: string;
  nameEng?: string;
  type: "STOCK" | "ETF" | "ETN" | "PREFERRED";
  market: string;
  exchange?: string;
  sector?: string;
  industry?: string;
  description?: string;
  logo?: string;
  website?: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StockStore {
  // 현재 선택된 주식 정보
  selectedStock: StockInfo | null;

  // 최근 검색한 주식들 (최대 10개)
  recentStocks: StockInfo[];

  // Actions
  setSelectedStock: (stock: StockInfo) => void;
  clearSelectedStock: () => void;
  addToRecentStocks: (stock: StockInfo) => void;
  getStockBySymbol: (symbol: string) => StockInfo | null;
  clearRecentStocks: () => void;
}

export const useStockStore = create<StockStore>()(
  persist(
    (set, get) => ({
      selectedStock: null,
      recentStocks: [],

      setSelectedStock: (stock: StockInfo) => {
        set({ selectedStock: stock });
        // 선택한 주식을 최근 목록에도 추가
        get().addToRecentStocks(stock);
      },

      clearSelectedStock: () => {
        set({ selectedStock: null });
      },

      addToRecentStocks: (stock: StockInfo) => {
        set((state) => {
          // 이미 있는 주식이면 맨 앞으로 이동
          const filtered = state.recentStocks.filter(
            (s) => s.symbol !== stock.symbol
          );
          const newRecentStocks = [stock, ...filtered].slice(0, 10); // 최대 10개
          return { recentStocks: newRecentStocks };
        });
      },

      getStockBySymbol: (symbol: string) => {
        const state = get();

        // 현재 선택된 주식이 해당 심볼이면 반환
        if (state.selectedStock && state.selectedStock.symbol === symbol) {
          return state.selectedStock;
        }

        // 최근 주식 목록에서 찾기
        return (
          state.recentStocks.find((stock) => stock.symbol === symbol) || null
        );
      },

      clearRecentStocks: () => {
        set({ recentStocks: [] });
      },
    }),
    {
      name: "stock-storage", // localStorage key
      // 세션 스토리지가 아닌 로컬 스토리지에 저장해서 브라우저 재시작 후에도 유지
    }
  )
);
