"use client";

import Image from "next/image";
import { VETLINK_LOGO_DARK, VETLINK_LOGO_LIGHT } from "@/lib/brand-assets";

export type VetLinkLogoVariant = "light" | "dark";
export type VetLinkLogoSize = "sm" | "md" | "lg" | "xl";

const SRC: Record<VetLinkLogoVariant, string> = {
  light: VETLINK_LOGO_LIGHT,
  dark: VETLINK_LOGO_DARK,
};

const SIZE_CLASS: Record<VetLinkLogoSize, string> = {
  sm: "h-10 w-auto min-w-0",
  md: "h-12 sm:h-14 w-auto min-w-0",
  lg: "h-14 sm:h-16 lg:h-[4.75rem] w-auto min-w-0",
  xl: "h-16 sm:h-[4.75rem] lg:h-[5.25rem] w-auto min-w-0",
};

/** Intrinsic dimensions for `next/image` (approximate; width auto from aspect). */
const INTRINSIC: Record<VetLinkLogoSize, { width: number; height: number }> = {
  sm: { width: 220, height: 77 },
  md: { width: 280, height: 98 },
  lg: { width: 360, height: 126 },
  xl: { width: 440, height: 154 },
};

export type VetLinkLogoProps = {
  variant: VetLinkLogoVariant;
  size?: VetLinkLogoSize;
  className?: string;
  priority?: boolean;
};

export function VetLinkLogo({
  variant,
  size = "md",
  className = "",
  priority = false,
}: VetLinkLogoProps) {
  const { width, height } = INTRINSIC[size];
  return (
    <Image
      src={SRC[variant]}
      alt="VetLink"
      width={width}
      height={height}
      className={`${SIZE_CLASS[size]} ${className}`.trim()}
      priority={priority}
    />
  );
}
