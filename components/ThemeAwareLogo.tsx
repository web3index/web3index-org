import { useTheme } from "next-themes";
import Box from "./Box";
import type { ComponentProps } from "react";

type ThemeAwareLogoProps = Omit<ComponentProps<typeof Box>, "as" | "src"> & {
  lightSrc: string;
  darkSrc: string;
  alt: string;
};

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
    <Box
      as="img"
      src={src}
      alt={alt}
      width={width}
      height={height}
      {...props}
    />
  );
};

export default ThemeAwareLogo;
