import { useWindowDimensions } from "react-native";

export const CONTENT_MAX_WIDTH = 560;

export function useLayout() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 700;
  const contentWidth = Math.min(width, CONTENT_MAX_WIDTH);
  const horizontalPad = Math.max(16, (width - CONTENT_MAX_WIDTH) / 2);
  return { screenWidth: width, contentWidth, isTablet, horizontalPad };
}
