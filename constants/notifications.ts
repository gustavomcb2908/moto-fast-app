export type NotificationType = 'delivery' | 'payment' | 'inspection' | 'message' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'delivery',
    title: 'Nova Entrega Disponível',
    description: 'Uma nova entrega foi atribuída a você em Luanda, Talatona.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
    actionUrl: '/orders',
  },
  {
    id: '2',
    type: 'payment',
    title: 'Pagamento Recebido',
    description: 'Pagamento de 15.000 Kz foi creditado na sua conta.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
  },
  {
    id: '3',
    type: 'inspection',
    title: 'Vistoria Agendada',
    description: 'Sua vistoria mensal está agendada para 15/11/2025 às 10:00.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: true,
    actionUrl: '/rental',
  },
  {
    id: '4',
    type: 'message',
    title: 'Nova Mensagem do Suporte',
    description: 'Sua solicitação foi respondida pela equipe de suporte.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
    actionUrl: '/profile/support',
  },
  {
    id: '5',
    type: 'delivery',
    title: 'Entrega Concluída',
    description: 'Entrega #12345 foi concluída com sucesso. Avalie o cliente.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    read: true,
  },
  {
    id: '6',
    type: 'system',
    title: 'Atualização do App',
    description: 'Nova versão disponível com melhorias e correções.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    read: true,
  },
];

export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'delivery':
      return '📦';
    case 'payment':
      return '💰';
    case 'inspection':
      return '🔍';
    case 'message':
      return '💬';
    case 'system':
      return '⚙️';
    default:
      return '🔔';
  }
}

export function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const notificationTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - notificationTime.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Agora mesmo';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `há ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `há ${diffInWeeks} ${diffInWeeks === 1 ? 'semana' : 'semanas'}`;
  }

  return notificationTime.toLocaleDateString('pt-PT');
}
