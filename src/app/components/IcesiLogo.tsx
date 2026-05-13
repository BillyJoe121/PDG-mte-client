import logoIcesi from "../../imports/image-6.png";

interface IcesiLogoProps {
  variant?: "color" | "white" | "dark";
  size?: "sm" | "md" | "lg";
}

export function IcesiLogo({ variant = "color", size = "md" }: IcesiLogoProps) {
  const heights = { sm: 28, md: 38, lg: 52 };
  const h = heights[size];

  return (
    <img
      src={logoIcesi}
      alt="Universidad ICESI"
      style={{ height: h, width: "auto", objectFit: "contain", display: "block" }}
    />
  );
}
