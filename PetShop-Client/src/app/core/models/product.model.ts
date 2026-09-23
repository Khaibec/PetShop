export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  stock: number;
  brand: string;
  imageUrl: string;
  categoryId: number;
  categoryName: string;
  rating: number;
  reviewCount: number;
  soldQuantity: number;
  isFeatured: boolean;
}

export interface Review {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ProductDetail extends Product {
  description: string;
  additionalImages: string[];
  createdAt: string;
  reviews: Review[];
}

export interface ProductFilter {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  categoryId?: number;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}
