// K-means 알고리즘을 위한 타입 정의
export interface ColorPoint {
  r: number;
  g: number;
  b: number;
}

export interface Cluster {
  centroid: ColorPoint;
  points: ColorPoint[];
}

// 색상 필터링 옵션 인터페이스
export interface ColorFilterOptions {
  excludeWhite?: boolean;
  excludeBlack?: boolean;
  excludeGray?: boolean;
  minBrightness?: number; // 0-255, 최소 밝기
  maxBrightness?: number; // 0-255, 최대 밝기
  minSaturation?: number; // 0-100, 최소 채도 (퍼센트)
  maxSaturation?: number; // 0-100, 최대 채도 (퍼센트) - 쨍한 색상 방지
  avoidVividColors?: boolean; // 쨍한 색상 피하기 (높은 채도 + 중간 밝기)
  preferMutedColors?: boolean; // 차분한 색상 선호
  excludeColors?: string[]; // 제외할 색상들 (hex, rgb 형식)
}

// 색상의 밝기(brightness) 계산 (0-255)
export const getColorBrightness = (color: ColorPoint): number => {
  // Perceived brightness 공식 사용
  return Math.round(0.299 * color.r + 0.587 * color.g + 0.114 * color.b);
};

// 색상의 채도(saturation) 계산 (0-100)
export const getColorSaturation = (color: ColorPoint): number => {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  if (max === 0) return 0;

  const saturation = ((max - min) / max) * 100;
  return Math.round(saturation);
};

// 색상이 흰색에 가까운지 체크
export const isNearWhite = (
  color: ColorPoint,
  threshold: number = 240
): boolean => {
  return color.r >= threshold && color.g >= threshold && color.b >= threshold;
};

// 색상이 검은색에 가까운지 체크
export const isNearBlack = (
  color: ColorPoint,
  threshold: number = 30
): boolean => {
  return color.r <= threshold && color.g <= threshold && color.b <= threshold;
};

// 색상이 회색에 가까운지 체크 (채도가 낮은 색상)
export const isNearGray = (
  color: ColorPoint,
  saturationThreshold: number = 15
): boolean => {
  return getColorSaturation(color) <= saturationThreshold;
};

// 색상이 쨍한지 체크 (높은 채도 + 중간~높은 밝기)
export const isVividColor = (
  color: ColorPoint,
  saturationThreshold: number = 70,
  brightnessRange: [number, number] = [80, 220]
): boolean => {
  const saturation = getColorSaturation(color);
  const brightness = getColorBrightness(color);

  return (
    saturation >= saturationThreshold &&
    brightness >= brightnessRange[0] &&
    brightness <= brightnessRange[1]
  );
};

// 색상이 차분한지 체크 (적당한 채도 + 부드러운 느낌)
export const isMutedColor = (color: ColorPoint): boolean => {
  const saturation = getColorSaturation(color);
  const brightness = getColorBrightness(color);

  // 차분한 색상의 조건:
  // 1. 채도가 너무 높지 않음 (60% 이하)
  // 2. 너무 밝거나 어둡지 않음 (40-200 범위)
  // 3. 회색은 아님 (최소 채도 10%)
  return (
    saturation <= 60 &&
    saturation >= 10 &&
    brightness >= 40 &&
    brightness <= 200
  );
};

// 색상이 필터 조건에 맞는지 체크
export const isColorValid = (
  color: ColorPoint,
  filters: ColorFilterOptions = {}
): boolean => {
  const {
    excludeWhite = false,
    excludeBlack = false,
    excludeGray = false,
    minBrightness = 0,
    maxBrightness = 255,
    minSaturation = 0,
    maxSaturation = 100,
    avoidVividColors = false,
    preferMutedColors = false,
  } = filters;

  // 흰색 제외
  if (excludeWhite && isNearWhite(color)) return false;

  // 검은색 제외
  if (excludeBlack && isNearBlack(color)) return false;

  // 회색 제외
  if (excludeGray && isNearGray(color)) return false;

  // 밝기 체크
  const brightness = getColorBrightness(color);
  if (brightness < minBrightness || brightness > maxBrightness) return false;

  // 채도 체크
  const saturation = getColorSaturation(color);
  if (saturation < minSaturation || saturation > maxSaturation) return false;

  // 쨍한 색상 제외
  if (avoidVividColors && isVividColor(color)) return false;

  // 차분한 색상만 선호
  if (preferMutedColors && !isMutedColor(color)) return false;

  return true;
};

// K-means 알고리즘 구현
export const kMeansColorExtraction = (
  imageData: ImageData,
  k: number = 5,
  maxIterations: number = 10
): ColorPoint[] => {
  const pixels: ColorPoint[] = [];

  // 이미지 데이터에서 픽셀 추출 (성능을 위해 샘플링)
  for (let i = 0; i < imageData.data.length; i += 16) {
    // 4픽셀마다 샘플링
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];

    // 투명한 픽셀은 제외
    if (a > 128) {
      pixels.push({ r, g, b });
    }
  }

  if (pixels.length === 0) return [];

  // 초기 중심점 랜덤 선택
  const clusters: Cluster[] = [];
  for (let i = 0; i < k; i++) {
    const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
    clusters.push({
      centroid: { ...randomPixel },
      points: [],
    });
  }

  // K-means 반복
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // 클러스터 초기화
    clusters.forEach((cluster) => (cluster.points = []));

    /**
     * 모든 픽셀에 대해, K개의 중심점(Centroid) 색상 중 어떤 색상과 가장 가까운지 계산한다
     * 거리 계산은 3차원 공간의 두 점 사이 거리를 구하는 유클리드 거리(Euclidean Distance) 공식을 사용합니다. sqrt((r1-r2)² + (g1-g2)² + (b1-b2)²)
     * 각 픽셀은 가장 가깝다고 판단된 클러스터에 소속된다.
     */
    pixels.forEach((pixel) => {
      let minDistance = Infinity;
      let closestCluster = 0;

      clusters.forEach((cluster, index) => {
        const distance = Math.sqrt(
          Math.pow(pixel.r - cluster.centroid.r, 2) +
            Math.pow(pixel.g - cluster.centroid.g, 2) +
            Math.pow(pixel.b - cluster.centroid.b, 2)
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = index;
        }
      });

      clusters[closestCluster].points.push(pixel);
    });

    /**
     * 새로운 중심점 계산
     * 클러스터에 모인 모든 픽셀들의 평균 R, G, B 값을 계산하여 새로운 중심점(Centroid)으로 업데이트
     */
    clusters.forEach((cluster) => {
      if (cluster.points.length > 0) {
        const avgR =
          cluster.points.reduce((sum, p) => sum + p.r, 0) /
          cluster.points.length;
        const avgG =
          cluster.points.reduce((sum, p) => sum + p.g, 0) /
          cluster.points.length;
        const avgB =
          cluster.points.reduce((sum, p) => sum + p.b, 0) /
          cluster.points.length;

        cluster.centroid = {
          r: Math.round(avgR),
          g: Math.round(avgG),
          b: Math.round(avgB),
        };
      }
    });
  }

  // 클러스터를 포인트 수로 정렬 (가장 많은 픽셀을 가진 색상이 대표색)
  clusters.sort((a, b) => b.points.length - a.points.length);

  /**
   * 정렬된 클러스터들의 최종 중심점(대표 색상) 목록을 반환
   */
  return clusters.map((cluster) => cluster.centroid);
};

// URL이 같은 도메인인지 체크
const isSameDomain = (url: string): boolean => {
  try {
    const imageUrl = new URL(url, window.location.origin);
    return imageUrl.origin === window.location.origin;
  } catch {
    return true; // 상대 경로인 경우 같은 도메인으로 간주
  }
};

// 이미지를 프록시를 통해 로드하는 함수
const loadImageThroughProxy = (imageSrc: string): string => {
  // Next.js API 라우트를 통한 프록시 (필요시 구현)
  return `/api/proxy-image?url=${encodeURIComponent(imageSrc)}`;
};

// 이미지에서 색상 추출
export const extractColorsFromImage = (
  imageSrc: string,
  options: {
    k?: number;
    maxIterations?: number;
    maxImageSize?: number;
    useProxy?: boolean;
    corsMode?: "anonymous" | "use-credentials" | null;
  } = {}
): Promise<ColorPoint[]> => {
  const {
    k = 5,
    maxIterations = 10,
    maxImageSize = 100,
    useProxy = false,
    corsMode = "anonymous",
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    // base64 이미지인 경우 직접 처리
    if (imageSrc.startsWith("data:")) {
      const img = document.createElement("img");

      img.onload = () => {
        try {
          processImage(
            img,
            canvas,
            ctx,
            maxImageSize,
            k,
            maxIterations,
            resolve,
            reject
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error("Failed to load base64 image"));
      img.src = imageSrc;
      return;
    }

    // 외부 이미지 처리
    const processExternalImage = (src: string, attempt: number = 1) => {
      const img = document.createElement("img");

      // CORS 설정
      if (corsMode && !isSameDomain(src)) {
        img.crossOrigin = corsMode;
      }

      img.onload = () => {
        try {
          processImage(
            img,
            canvas,
            ctx,
            maxImageSize,
            k,
            maxIterations,
            resolve,
            reject
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        console.warn(`이미지 로드 실패 (attempt ${attempt}):`, src);

        // 첫 번째 시도 실패 시 다른 방법들 시도
        if (attempt === 1) {
          // CORS 모드 없이 재시도
          if (corsMode) {
            console.log("CORS 모드 없이 재시도...");
            processExternalImage(src, 2);
            return;
          }
        } else if (attempt === 2 && useProxy) {
          // 프록시를 통해 재시도
          console.log("프록시를 통해 재시도...");
          const proxySrc = loadImageThroughProxy(imageSrc);
          processExternalImage(proxySrc, 3);
          return;
        }

        reject(
          new Error(
            `Failed to load image after ${attempt} attempts. CORS policy may be blocking the request.`
          )
        );
      };

      img.src = src;
    };

    processExternalImage(imageSrc);
  });
};

// 이미지 처리 로직을 분리한 헬퍼 함수
const processImage = (
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  maxImageSize: number,
  k: number,
  maxIterations: number,
  resolve: (colors: ColorPoint[]) => void,
  reject: (error: Error) => void
) => {
  // 성능을 위해 이미지 크기 조정
  const scale = Math.min(maxImageSize / img.width, maxImageSize / img.height);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  try {
    /**
     * 픽셀 데이터 추출: ctx.getImageData()를 통해 캔버스에 그려진 이미지의 모든 픽셀 정보를 ImageData 객체로 가져온다
     */
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const dominantColors = kMeansColorExtraction(imageData, k, maxIterations);
    resolve(dominantColors);
  } catch (error) {
    reject(error as Error);
  }
};

// 단일 대표 색상 추출 (가장 자주 사용될 함수)
export const extractDominantColor = async (
  imageSrc: string,
  options?: {
    k?: number;
    maxIterations?: number;
    maxImageSize?: number;
    colorFilter?: ColorFilterOptions;
    useProxy?: boolean;
    corsMode?: "anonymous" | "use-credentials" | null;
  }
): Promise<string | null> => {
  try {
    const { colorFilter = {}, ...extractOptions } = options || {};
    const colors = await extractColorsFromImage(imageSrc, extractOptions);

    // 필터 조건에 맞는 첫 번째 색상 찾기
    for (const color of colors) {
      if (isColorValid(color, colorFilter)) {
        return `rgb(${color.r}, ${color.g}, ${color.b})`;
      }
    }

    // 조건에 맞는 색상이 없으면 첫 번째 색상 반환 (폴백)
    if (colors.length > 0) {
      const mainColor = colors[0];
      return `rgb(${mainColor.r}, ${mainColor.g}, ${mainColor.b})`;
    }

    return null;
  } catch (error) {
    console.warn("색상 추출 중 오류:", error);
    return null;
  }
};

// 색상을 hex 형식으로 변환하는 유틸리티
export const colorToHex = (color: ColorPoint): string => {
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
};

// 색상을 rgb 형식으로 변환하는 유틸리티
export const colorToRgb = (color: ColorPoint): string => {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
};

// 여러 색상을 팔레트로 반환하는 함수
export const extractColorPalette = async (
  imageSrc: string,
  options: {
    k?: number;
    maxIterations?: number;
    maxImageSize?: number;
    format?: "rgb" | "hex";
    colorFilter?: ColorFilterOptions;
    useProxy?: boolean;
    corsMode?: "anonymous" | "use-credentials" | null;
  } = {}
): Promise<string[]> => {
  const { format = "rgb", colorFilter = {}, ...extractOptions } = options;

  try {
    const colors = await extractColorsFromImage(imageSrc, extractOptions);

    // 필터 조건에 맞는 색상들만 선택
    const filteredColors = colors.filter((color) =>
      isColorValid(color, colorFilter)
    );

    // 필터링된 색상이 없으면 원본 색상 반환
    const finalColors = filteredColors.length > 0 ? filteredColors : colors;

    return finalColors.map((color) =>
      format === "hex" ? colorToHex(color) : colorToRgb(color)
    );
  } catch (error) {
    console.warn("색상 팔레트 추출 중 오류:", error);
    return [];
  }
};
