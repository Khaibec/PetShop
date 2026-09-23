export interface Pet {
  id: number;
  name: string;
  breed: string;
  species: 'Chó' | 'Mèo' | string;
  ageMonths: number;
  gender: 'Đực' | 'Cái' | string;
  color: string;
  weightKg: number;
  price: number;
  originalPrice?: number;
  vaccinated: boolean;
  dewormed: boolean;
  status: 'Available' | 'Reserved' | 'Sold' | string;
  imageUrl: string;
  isFeatured: boolean;
}

export interface PetDetail extends Pet {
  healthCertificate: string;
  description: string;
  additionalImages: string[];
  createdAt: string;
}

export interface PetFilter {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  species?: string;
  breed?: string;
  gender?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
}
