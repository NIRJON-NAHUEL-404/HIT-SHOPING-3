import React from 'react';
import { 
  Shirt, 
  ShoppingBag, 
  Briefcase, 
  Zap, 
  Layers, 
  Tag,
  Package,
  Watch,
  Smartphone,
  Glasses,
  Gem
} from 'lucide-react';

export const CategoryIcon: React.FC<{ category: string; className?: string; image?: string }> = ({ category, className, image }) => {
  if (image) {
    return <img src={image} className={className} alt={category} referrerPolicy="no-referrer" style={{ objectFit: 'cover', borderRadius: 'inherit' }} />;
  }

  const iconProps = {
    className: className || "w-6 h-6 md:w-9 md:h-9 text-cyan-500",
    strokeWidth: 1.2 // Thinner, cleaner lines like in the image
  };

  // Normalize category name for matching
  const cat = category.toLowerCase().replace(/[^a-z0-9]/g, '');

  switch (cat) {
    case 'panjabi': 
      return <Shirt {...iconProps} />;
    case 'shirt': 
      return <Shirt {...iconProps} />;
    case 'pant': 
      return <Layers {...iconProps} />;
    case 'formalitem': 
    case 'formal':
      return <Briefcase {...iconProps} />;
    case 'genzitem': 
    case 'genz':
      return <Zap {...iconProps} />;
    case 'womensitem': 
    case 'women':
      return <ShoppingBag {...iconProps} />;
    case 'threepiece': 
      return <Layers {...iconProps} />;
    case 'tshirt': 
      return <Shirt {...iconProps} />;
    case 'accessories':
      return <Watch {...iconProps} />;
    case 'gadgets':
      return <Smartphone {...iconProps} />;
    case 'eyewear':
      return <Glasses {...iconProps} />;
    case 'jewelry':
      return <Gem {...iconProps} />;
    default: 
      return <Package {...iconProps} />;
  }
};
