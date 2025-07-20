import React, { useEffect, useRef, useLayoutEffect, useState } from "react";

interface TooltipProps {
  isVisible: boolean;
  clickedPosition: { x: number; y: number };
  children: React.ReactNode;
  onClose?: () => void;
  className?: string; // 추가 스타일링을 위한 클래스
  style?: React.CSSProperties; // 추가 스타일링
  margin?: number; // 화면 경계와의 여백 (기본값: 10)
  offset?: number; // 아이콘과 툴팁 사이의 거리 (기본값: 10)
}

export default function Tooltip({
  isVisible,
  clickedPosition,
  children,
  onClose,
  className,
  style,
  margin = 10,
  offset = 10,
}: TooltipProps) {
  const tooltipPadding = 16;
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState<{
    left: number;
    top: number;
  }>({ left: 0, top: 0 });

  const [isAbove, setIsAbove] = useState(false);
  const [isRight, setIsRight] = useState(false);
  let earlyOverflowState = "";

  // 스크롤 락 적용
  useEffect(() => {
    if (isVisible) {
      earlyOverflowState = document.body.style.overflow;

      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = earlyOverflowState;
    }

    return () => {
      // 클린업
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [isVisible]);

  // 4방향 배치 가능성을 계산하고 최적의 방향 선택
  const calculateBestPosition = (
    tooltipWidth: number,
    tooltipHeight: number
  ): {
    left: number;
    top: number;
  } => {
    const { x, y } = clickedPosition;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 각 방향별 가능한 공간 계산
    const spaces = {
      bottom: windowHeight - y - margin,
      top: y - margin,
      right: windowWidth - x - margin,
      left: x - margin,
    };

    const widthSpaceNeeded = tooltipWidth + offset;
    const heightSpaceNeeded = tooltipHeight + offset;

    let targetPosition = { left: 0, top: 0 };

    /**
     * x축 위치 설정
     */
    if (spaces.right > widthSpaceNeeded - tooltipPadding - offset / 2) {
      targetPosition = {
        ...targetPosition,
        left: x - tooltipPadding - offset / 2,
      };
    } else {
      const xOverflow = spaces.right - widthSpaceNeeded - offset;
      targetPosition = {
        ...targetPosition,
        left: x + xOverflow,
      };
    }

    /**
     * y축 위치 설정
     */
    if (spaces.top > heightSpaceNeeded - offset / 2) {
      targetPosition = {
        ...targetPosition,
        top: y - heightSpaceNeeded - offset / 2,
      };
    } else {
      targetPosition = {
        ...targetPosition,
        top: y + offset,
      };
    }

    return targetPosition;
  };

  // 렌더링 후 실제 크기를 측정하여 위치 계산
  useLayoutEffect(() => {
    if (!isVisible || !tooltipRef.current) return;

    const tooltipElement = tooltipRef.current;
    const rect = tooltipElement.getBoundingClientRect();
    const tooltipWidth = rect.width;
    const tooltipHeight = rect.height;

    const bestPosition = calculateBestPosition(tooltipWidth, tooltipHeight);

    setPosition(bestPosition);

    setIsAbove(bestPosition.top < clickedPosition.y);
    setIsRight(bestPosition.left + tooltipWidth / 2 > clickedPosition.x);
  }, [isVisible, clickedPosition, margin, offset]);

  if (!isVisible) return null;

  return (
    <>
      {/* 오버레이 (클릭하면 툴팁 닫기) */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 999,
        }}
        onClick={onClose}
      />

      {/* 툴팁 */}
      <div
        ref={tooltipRef}
        className={className}
        style={{
          position: "fixed",
          left: `${position.left}px`,
          top: `${position.top}px`,
          backgroundColor: "white",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          padding: "12px 16px",
          fontSize: "14px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 1000,
          maxWidth: "280px",
          color: "#374151",
          lineHeight: "1.4",
          ...style,
        }}
      >
        {/* 말풍선 화살표 */}
        <div
          style={{
            position: "absolute",
            width: "12px",
            height: "12px",
            backgroundColor: "white",
            transform: "rotate(45deg)",
            ...(isAbove && {
              bottom: "-6px",
              borderRight: "1px solid #d1d5db",
              borderBottom: "1px solid #d1d5db",
            }),
            ...(!isAbove && {
              top: "-6px",
              borderLeft: "1px solid #d1d5db",
              borderTop: "1px solid #d1d5db",
            }),
            ...(isRight && {
              left: `${tooltipPadding + 1}px`,
            }),
            ...(!isRight && {
              right: `${tooltipPadding}px`,
            }),
          }}
        />

        {/* 툴팁 내용 */}
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </div>
    </>
  );
}
