export interface Schedule {
  open: string;
  close: string;
  closed: boolean;
}

export interface Contact {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  phone: string;
  website: string;
  email: string;
}

export interface Schedules {
  monday: Schedule;
  tuesday: Schedule;
  wednesday: Schedule;
  thursday: Schedule;
  friday: Schedule;
  saturday: Schedule;
  sunday: Schedule;
}

export interface CulturalPlaceInterface {
  name: string;
  description: string;
  category: string;
  characteristics: string[];
  schedules: Schedules;
  contact: Contact;
  image: string;
  rating: number;
  isActive: boolean;
  status: string;
  color: string;
}

export interface CreateCulturalPlaceDto {
  name: string;
  description: string;
  category: string;
  characteristics?: string[];
  schedules: Schedules;
  contact: Contact;
  image: string;
  rating?: number;
  isActive?: boolean;
  status?: string;
}

export interface UpdateCulturalPlaceDto {
  name?: string;
  description?: string;
  category?: string;
  characteristics?: string[];
  schedules?: Schedules;
  contact?: Contact;
  image?: string;
  rating?: number;
  isActive?: boolean;
  status?: string;
  color?: string;
}

export interface CulturalPlaceQueryDto {
  category?: string;
  isActive?: boolean;
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  limit?: number;
  page?: number;
}
