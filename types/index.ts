// Schedule types
export interface Schedule {
  id: string;
  startDate: string;
  endDate: string;
  price: number;
  bookedPeople: number;
  availableSlot: number;
  note?: string;
  active: boolean;
}

// Itinerary types
export interface Itinerary {
  id: string;
  locationName?: string;
  visitOrder?: number;
  days?: number;
  note?: string;
  // For TourItinerary structure
  dayNumber?: number;
  title?: string;
  description?: string;
}

// Tour types
export interface Tour {
  id: string;
  name: string;
  destination: string;
  description?: string;
  image?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'Active' | 'Pending' | 'Completed' | 'Cancelled';
  startDate: string;
  endDate?: string;
  duration?: string;
  capacity?: number;
  booked?: number;
  price: number;
  guide?: string;
  itinerary?: Itinerary[];
  createdAt: string;
  updatedAt?: string;
  // Additional fields for editing
  tourType?: string;
  priceType?: string | null;
  rating?: number;
  durationDays?: number;
  durationNights?: number;
  maximumSlots?: number;
  minPeople?: number;
  startDestinationName?: string;
  endDestinationName?: string;
  availableSlots?: number;
  vehicleType?: string;
  // Database required fields
  managerId?: string | null;
  tourPlannerId?: string | null;
  endDestinationId?: string | null;
  startDestinationId?: string | null;
  createdBy?: string | null;
  // Schedule
  schedules?: Schedule[];
}

// Booking types
export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Refunded';
export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'E_WALLET';

export interface Booking {
  id: string;
  tourId: string;
  tourName?: string;
  destination?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  numberOfPeople: number;
  adults?: number;
  children?: number;
  quantity?: number;
  unitPrice?: number;
  totalPrice: number;
  discountAmount?: number;
  finalPrice?: number;
  paymentMethod?: PaymentMethod | string;
  paymentStatus?: PaymentStatus | string;
  status: BookingStatus;
  bookingDate: string;
  paymentDate?: string;
  startDate?: string;
  specialRequests?: string;
  pointUsed?: number;
  createdAt: string;
  updatedAt: string;
}

// User/Customer types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  profileImage?: string;
  totalBookings: number;
  totalSpent: number;
  joinDate: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  createdAt: string;
  updatedAt: string;
  point: number;
}

// Account types
export interface Account {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  branch?: {
    id: string;
    name: string;
    location?: string;
    address?: string;
  };
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status: number;
}

// List response
export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
// User profile type
export interface UserProfile {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  role: string;
  userType: string;
  active: boolean;
  [key: string]: any;
}