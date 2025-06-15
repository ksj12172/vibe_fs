'use client';

import { useState } from 'react';
import CompanySearch from '../components/CompanySearch';
import FinancialOptions from '../components/FinancialOptions';
import LoadingSection from '../components/LoadingSection';
import FinancialResults from '../components/FinancialResults';
import ErrorSection from '../components/ErrorSection';

export default function HomePage() {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [currentStep, setCurrentStep] = useState('search'); // search, options, loading, results, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setCurrentStep('options');
  };

  const handleStartLoading = () => {
    setCurrentStep('loading');
  };

  const handleDataLoaded = (data) => {
    setFinancialData(data);
    setCurrentStep('results');
  };

  const handleError = (message) => {
    setErrorMessage(message);
    setCurrentStep('error');
  };

  const resetToSearch = () => {
    setSelectedCompany(null);
    setFinancialData(null);
    setCurrentStep('search');
    setErrorMessage('');
  };

  return (
    <div className="container">
      <header>
        <h1>📊 재무제표 시각화</h1>
        <p>한국 상장기업의 재무제표를 쉽게 조회하고 시각화해보세요</p>
      </header>

      <main>
        {/* 1단계: 회사 검색 */}
        <CompanySearch
          onCompanySelect={handleCompanySelect}
          onError={handleError}
        />

        {/* 2단계: 재무제표 옵션 선택 */}
        {(currentStep === 'options' ||
          currentStep === 'loading' ||
          currentStep === 'results') && (
          <FinancialOptions
            selectedCompany={selectedCompany}
            onStartLoading={handleStartLoading}
            onDataLoaded={handleDataLoaded}
            onError={handleError}
            visible={currentStep === 'options'}
          />
        )}

        {/* 3단계: 로딩 상태 */}
        {currentStep === 'loading' && <LoadingSection />}

        {/* 4단계: 결과 및 시각화 */}
        {currentStep === 'results' && (
          <FinancialResults
            selectedCompany={selectedCompany}
            financialData={financialData}
          />
        )}

        {/* 오류 메시지 */}
        {currentStep === 'error' && (
          <ErrorSection message={errorMessage} onReset={resetToSearch} />
        )}
      </main>
    </div>
  );
}
