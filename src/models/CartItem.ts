
export interface CartItem {
  id: string;
  mealId: string;
  quantity: number;
  price: number;
  subtotal: number;
  mealName: string;
  mealImage?: string;
  sellerName: string;
  sellerId: string;
  deliveryDate?: string;
  sellerKitchenOpen?: boolean;
  subscription?: {
    type: 'weekly' | 'monthly' | null;
    days?: string[];
    duration?: number;
  };
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}
