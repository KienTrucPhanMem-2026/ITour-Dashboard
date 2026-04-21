// Tour types
export interface Tour {
  id: string;
  name: string;
  destination: string;
  description?: string;
  image: string;
  status: 'Active' | 'Pending' | 'Completed' | 'Cancelled';
  startDate: string;
  endDate?: string;
  duration: string;
  capacity: number;
  booked: number;
  price: number;
  guide?: string;
  itinerary?: string[];
  createdAt: string;
  updatedAt: string;
}

// Booking types
export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';

export interface Booking {
  id: string;
  tourId: string;
  tourName?: string;
  destination?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  numberOfPeople: number;
  totalPrice: number;
  status: BookingStatus;
  bookingDate: string;
  startDate?: string;
  specialRequests?: string;
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
