export interface User {
  userId: string;
  email: string;
  role: string;
}

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELED';
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'REFUSED' | 'CANCELED';

export interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  status?: EventStatus;
  availableSpots?: number;
}

export interface Reservation {
  _id: string;
  eventId: string | Event;
  userId: string;
  status: ReservationStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReservationData {
  eventId: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  status?: EventStatus;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
}

interface RegisterResponse {
  message: string;
  userId: string;
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: 'Une erreur est survenue',
        }));
        throw new Error(error.message || 'Une erreur est survenue');
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez que le backend est démarré.');
      }
      throw error;
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  private requestWithAuth<T>(endpoint: string, options: RequestInit, token: string): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getEvents(token?: string, status?: string): Promise<Event[]> {
    const url = status ? `/events?status=${status}` : '/events';
    if (token) {
      return this.requestWithAuth<Event[]>(url, { method: 'GET' }, token);
    }
    return this.request<Event[]>(url, { method: 'GET' });
  }

  async getEventsAdmin(token: string): Promise<Event[]> {
    return this.requestWithAuth<Event[]>('/events/admin/all', { method: 'GET' }, token);
  }

  async getEvent(id: string): Promise<Event> {
    return this.request<Event>(`/events/${id}`, { method: 'GET' });
  }

  async createEvent(data: CreateEventData, token: string): Promise<Event> {
    return this.requestWithAuth<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async updateEvent(id: string, data: Partial<CreateEventData>, token: string): Promise<Event> {
    return this.requestWithAuth<Event>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token);
  }

  async publishEvent(id: string, token: string): Promise<Event> {
    return this.requestWithAuth<Event>(`/events/${id}/publish`, { method: 'PATCH' }, token);
  }

  async cancelEvent(id: string, token: string): Promise<Event> {
    return this.requestWithAuth<Event>(`/events/${id}/cancel`, { method: 'PATCH' }, token);
  }

  async createReservation(data: CreateReservationData, token: string): Promise<Reservation> {
    return this.requestWithAuth<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async getMyReservations(token: string): Promise<Reservation[]> {
    return this.requestWithAuth<Reservation[]>('/reservations/me', { method: 'GET' }, token);
  }

  async cancelReservation(id: string, token: string): Promise<Reservation> {
    return this.requestWithAuth<Reservation>(`/reservations/${id}/cancel`, { method: 'PATCH' }, token);
  }
}

export const apiService = new ApiService();
