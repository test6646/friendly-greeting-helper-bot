// Keep the existing file content and add the following interfaces

export interface CaptainProfile {
  id: string;
  userId: string;
  vehicleType: string;
  vehicleRegistration: string;
  serviceAreas: ServiceArea[];
  availabilitySchedule: AvailabilitySchedule;
  isActive: boolean;
  isAvailable: boolean;
  currentLocation: Location | null;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  averageRating: number;
  totalDeliveries: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceArea {
  name: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
  };
}

export interface AvailabilitySchedule {
  monday?: DailyAvailability;
  tuesday?: DailyAvailability;
  wednesday?: DailyAvailability;
  thursday?: DailyAvailability;
  friday?: DailyAvailability;
  saturday?: DailyAvailability;
  sunday?: DailyAvailability;
}

export interface DailyAvailability {
  isAvailable: boolean;
  shifts: TimeSlot[];
}

export interface TimeSlot {
  from: string; // 24-hour format, e.g., "09:00"
  to: string; // 24-hour format, e.g., "17:00"
}

export interface Location {
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export interface CaptainVerification {
  id: string;
  captainId: string;
  idProofUrl: string | null;
  addressProofUrl: string | null;
  profilePhotoUrl: string | null;
  otherDocuments: Record<string, any> | null;
  adminNotes: string | null;
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt: string | null;
  verifiedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  captainId: string;
  pickupTime: string | null;
  deliveryTime: string | null;
  deliveryCode: string | null;
  deliveryProofUrl: string | null;
  customerSignature: boolean;
  status: DeliveryStatus;
  deliveryNotes: string | null;
  distance: number | null;
  deliveryFee: number;
  captainRating: number | null;
  customerRating: number | null;
  createdAt: string;
  updatedAt: string;
}

export type DeliveryStatus = 
  | 'pending'
  | 'accepted'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

// Extended order status to include captain-related statuses
export type OrderStatus = 
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'accepted_by_captain'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';
