// ============================================
// AUTH TYPES
// ============================================
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'TRAVELER' | 'GUIDE' | 'AGENCY' | 'ADMIN';
  avatar: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ============================================
// GUIDE TYPES
// ============================================
export interface Guide {
  id: string;
  slug: string;
  bio: string | null;
  languages: string[];
  specialities: string[];
  experience: number;
  pricePerDay: number | null;
  location: string | null;
  coverImage: string | null;
  isVerified: boolean;
  rating: number;
  totalReviews: number;
  user: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

// ============================================
// AGENCY TYPES
// ============================================
export interface Agency {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo: string | null;
  coverImage: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  isVerified: boolean;
  rating: number;
  totalReviews: number;
}

// ============================================
// DESTINATION TYPES
// ============================================
export interface Destination {
  id: string;
  slug: string;
  name: string;
  country: string;
  city: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  _count?: {
    packages: number;
  };
}

// ============================================
// PACKAGE TYPES
// ============================================
export interface Package {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  maxGroupSize: number;
  images: string[];
  includes: string[];
  excludes: string[];
  itinerary: any;
  isActive: boolean;
  rating: number;
  totalReviews: number;
  destination: {
    name: string;
    city: string;
    country: string;
    slug: string;
  };
  guide?: {
    slug: string;
    user: {
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
  } | null;
  agency?: {
    slug: string;
    name: string;
    logo: string | null;
  } | null;
}

// ============================================
// BOOKING TYPES
// ============================================
export interface Booking {
  id: string;
  userId: string;
  packageId: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  startDate: string;
  endDate: string;
  groupSize: number;
  totalPrice: number;
  notes: string | null;
  createdAt: string;
  package?: {
    title: string;
    slug: string;
    price: number;
    duration: number;
    images: string[];
    destination: {
      name: string;
      city: string;
      country: string;
    };
  };
}

// ============================================
// REVIEW TYPES
// ============================================
export interface Review {
  id: string;
  userId: string;
  packageId: string;
  bookingId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

// ============================================
// MESSAGE TYPES
// ============================================
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

export interface Conversation {
  id: string;
  participants: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    role: string;
  }[];
  messages: {
    content: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  }[];
  updatedAt: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  data: any;
  createdAt: string;
}

// ============================================
// WEATHER TYPES
// ============================================
export interface CurrentWeather {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
}

export interface ForecastDay {
  date: string;
  minTemp: number;
  maxTemp: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

export interface WeatherForecast {
  city: string;
  country: string;
  forecast: ForecastDay[];
}

// ============================================
// PAGINATION TYPES
// ============================================
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}