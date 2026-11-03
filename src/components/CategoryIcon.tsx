import React from "react";
import {
  Briefcase,
  TrendingUp,
  Gift,
  Utensils,
  Car,
  Home,
  ShoppingBag,
  HeartPulse,
  Film,
  PiggyBank,
  Wallet,
  Tag,
} from "lucide-react";

interface CategoryIconProps {
  name: string;
  className?: string;
}

export function CategoryIcon({ name, className = "w-5 h-5" }: CategoryIconProps) {
  switch (name) {
    case "Briefcase":
      return <Briefcase className={className} />;
    case "TrendingUp":
      return <TrendingUp className={className} />;
    case "Gift":
      return <Gift className={className} />;
    case "Utensils":
      return <Utensils className={className} />;
    case "Car":
      return <Car className={className} />;
    case "Home":
      return <Home className={className} />;
    case "ShoppingBag":
      return <ShoppingBag className={className} />;
    case "HeartPulse":
      return <HeartPulse className={className} />;
    case "Film":
      return <Film className={className} />;
    case "PiggyBank":
      return <PiggyBank className={className} />;
    case "Tag":
      return <Tag className={className} />;
    default:
      return <Wallet className={className} />;
  }
}
