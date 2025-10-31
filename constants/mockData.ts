export interface Order {
  id: string;
  clientName: string;
  address: string;
  distance: number;
  value: number;
  timeWindow: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  pickupAddress?: string;
  deliveryProof?: string;
  lat: number;
  lng: number;
}

export interface Vehicle {
  id: string;
  model: string;
  plate: string;
  rentalStatus: 'active' | 'pending' | 'expired';
  nextPayment: string;
  monthlyFee: number;
  image?: string;
}

export interface Invoice {
  id: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  period: string;
  pdfUrl?: string;
}

export interface Inspection {
  id: string;
  date: string;
  status: 'pending' | 'scheduled' | 'approved' | 'rejected';
  notes?: string;
  photos?: string[];
  vehicleId: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'courier' | 'rental';
  timestamp: string;
  read: boolean;
  attachments?: { type: 'image' | 'pdf'; url: string }[];
}

export const mockOrders: Order[] = [
  {
    id: 'ord1',
    clientName: 'João Silva',
    address: 'Rua da Liberdade, 123, Lisboa',
    distance: 2.3,
    value: 12.50,
    timeWindow: '14:00 - 15:00',
    status: 'accepted',
    pickupAddress: 'Restaurante Porto, Av. Almirante Reis, 45',
    lat: 38.7223,
    lng: -9.1393,
  },
  {
    id: 'ord2',
    clientName: 'Maria Costa',
    address: 'Praça do Comércio, 1, Lisboa',
    distance: 4.1,
    value: 18.00,
    timeWindow: '15:30 - 16:30',
    status: 'pending',
    pickupAddress: 'Mercado Central, Rua Augusta, 200',
    lat: 38.7071,
    lng: -9.1361,
  },
  {
    id: 'ord3',
    clientName: 'Pedro Mendes',
    address: 'Rua Garrett, 88, Chiado, Lisboa',
    distance: 1.8,
    value: 9.50,
    timeWindow: '16:00 - 17:00',
    status: 'completed',
    pickupAddress: 'Café Chiado, Largo do Chiado, 10',
    lat: 38.7107,
    lng: -9.1421,
  },
];

export const mockVehicle: Vehicle = {
  id: 'v123',
  model: 'Honda CG 150',
  plate: 'MF-2025',
  rentalStatus: 'active',
  nextPayment: '2025-11-05',
  monthlyFee: 120.00,
};

export const mockInvoices: Invoice[] = [
  {
    id: 'inv1',
    amount: 120.00,
    dueDate: '2025-11-05',
    status: 'pending',
    period: 'Novembro 2025',
    pdfUrl: 'https://example.com/invoice1.pdf',
  },
  {
    id: 'inv2',
    amount: 120.00,
    dueDate: '2025-10-05',
    status: 'paid',
    period: 'Outubro 2025',
    pdfUrl: 'https://example.com/invoice2.pdf',
  },
];

export const mockInspection: Inspection = {
  id: 'insp1',
  date: '2025-11-01',
  status: 'pending',
  notes: 'Vistoria mensal obrigatória',
  vehicleId: 'v123',
};

export const mockMessages: Message[] = [
  {
    id: 'msg1',
    text: 'Bem-vindo ao Moto Fast! Seu contrato foi aprovado.',
    sender: 'rental',
    timestamp: '2025-10-28T10:00:00Z',
    read: true,
  },
  {
    id: 'msg2',
    text: 'Quando posso agendar a próxima vistoria?',
    sender: 'courier',
    timestamp: '2025-10-29T14:30:00Z',
    read: true,
  },
  {
    id: 'msg3',
    text: 'Você pode agendar para qualquer dia útil. Por favor, submeta as fotos através do app.',
    sender: 'rental',
    timestamp: '2025-10-29T15:00:00Z',
    read: false,
  },
];

export const mockSummary = {
  deliveriesToday: 5,
  inProgress: 1,
  pending: 2,
  completed: 2,
  earningsToday: 52.50,
  balance: 1250.75,
  alerts: [
    { type: 'warning' as const, message: 'Fatura vence em 3 dias' },
    { type: 'info' as const, message: 'Vistoria pendente' },
  ],
};
