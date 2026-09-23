export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  icon: string;
  type: 'Pet' | 'Supply';
  displayOrder: number;
  productCount: number;
}
