import { useTheme } from "next-themes";
import { styled } from "../stitches.config";
import type { ComponentProps } from "react";

const LogoImage = styled("img", {
  boxSizing: "border-box",
});

type ThemeAwareLogoProps = Omit<
  ComponentProps<typeof LogoImage>,
  "src" | "alt"
> & {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  width?: number | string;
  height?: number | string;
};

/**
 * Renders a brand logo that automatically swaps between light/dark SVGs based on theme.
 */
const ThemeAwareLogo = ({
  lightSrc,
  darkSrc,
  alt,
  width = 24,
  height = 24,
  ...props
}: ThemeAwareLogoProps) => {
  const { resolvedTheme } = useTheme();
  const src = resolvedTheme === "light" ? lightSrc : darkSrc;

  return (
    <LogoImage src={src} alt={alt} width={width} height={height} {...props} />
  );
};

export default ThemeAwareLogo;
