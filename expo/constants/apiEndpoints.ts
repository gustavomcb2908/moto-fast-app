export const API_CONFIG = {
  AUTH_API_URL: process.env.EXPO_PUBLIC_AUTH_API_URL || 'https://api.motofast.com/auth',
  DELIVERY_API_URL: process.env.EXPO_PUBLIC_DELIVERY_API_URL || 'https://api.motofast.com/delivery',
  RENTAL_API_URL: process.env.EXPO_PUBLIC_RENTAL_API_URL || 'https://api.motofast.com/rental',
  MAPS_API_KEY: process.env.EXPO_PUBLIC_MAPS_API_KEY || '',
  STRIPE_PUBLIC_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLIC_KEY || '',
};

export const ENDPOINTS = {
  auth: {
    register: '/register',
    login: '/login',
    logout: '/logout',
  },
  delivery: {
    orders: (courierId: string) => `/couriers/${courierId}/orders`,
    summary: (courierId: string) => `/couriers/${courierId}/summary`,
    acceptOrder: (orderId: string) => `/orders/${orderId}/accept`,
    startOrder: (orderId: string) => `/orders/${orderId}/start`,
    completeOrder: (orderId: string) => `/orders/${orderId}/complete`,
  },
  rental: {
    summary: (courierId: string) => `/couriers/${courierId}/rental`,
    invoices: (courierId: string) => `/couriers/${courierId}/invoices`,
    payments: '/payments',
    vehicles: '/vehicles/available',
    vehicleDocuments: (vehicleId: string) => `/vehicles/${vehicleId}/documents`,
    inspections: (courierId: string) => `/couriers/${courierId}/inspections`,
    submitInspection: '/inspections',
    messages: (courierId: string) => `/couriers/${courierId}/messages`,
    changeVehicle: '/vehicles/change-request',
  },
};
