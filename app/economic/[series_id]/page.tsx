"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import EconomicIndicators from "../../../components/EconomicIndicators";
import economicIndicatorsData from "../../../data/economic-indicators.json";

interface EconomicData {
  time: number;
  value: number;
}

interface FredApiResponse {
  success: boolean;
  data?: {
    series_id: string;
    title: string;
    data: EconomicData[];
    total_count: number;
    server: string;
    timestamp: string;
  };
  error?: {
    code: number;
    message: string;
  };
}

export default function EconomicPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const seriesId = params?.series_id as string;
  
  const [economicData, setEconomicData] = useState<FredApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const seriesInfo = economicIndicatorsData[seriesId as keyof typeof economicIndicatorsData] || {
    title: `FRED Series: ${seriesId}`,
    description: "경제 지표 데이터"
  };

  useEffect(() => {
    const fetchEconomicData = async () => {
      if (!seriesId) return;

      setLoading(true);
      setError(null);

      try {
        // 개발 환경에서는 Flask 서버, 프로덕션에서는 Vercel API 사용
        const isDevelopment = process.env.NODE_ENV === 'development';
        const baseUrl = isDevelopment 
          ? 'http://localhost:5001'
          : '';
        
        let url = `${baseUrl}/api/fred-data/${seriesId}`;
        
        // 쿼리 파라미터 추가
        const urlParams = new URLSearchParams();
        const startDate = searchParams?.get('start_date');
        const endDate = searchParams?.get('end_date');
        
        if (startDate) urlParams.append('start_date', startDate);
        if (endDate) urlParams.append('end_date', endDate);
        
        if (urlParams.toString()) {
          url += `?${urlParams.toString()}`;
        }

        console.log('Fetching economic data from:', url);
        
        const response = await fetch(url);
        const data: FredApiResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || '데이터를 가져오는데 실패했습니다');
        }

        setEconomicData(data);
      } catch (err) {
        console.error('Error fetching economic data:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchEconomicData();
  }, [seriesId, searchParams]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">경제 지표 데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">오류 발생</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!economicData?.data || !economicData.data.data || economicData.data.data.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">해당 시리즈에 대한 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {seriesInfo.title}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <EconomicIndicators
          seriesId={economicData.data.series_id}
          title={economicData.data.title}
          data={economicData.data.data}
          indicatorInfo={seriesInfo}
        />
      </div>
    </div>
  );
} 