# Moto Fast - Documentação do Projeto

## 📱 Sobre o Moto Fast

**Moto Fast** é uma aplicação React Native com Expo para estafetas/couriers que realizam entregas last-mile e alugam motos da locadora parceira.

## ✅ Funcionalidades Implementadas

### 1. **Autenticação Completa**
- Login com email e senha
- Registo multi-step (onboarding):
  - **Passo 1**: Dados pessoais (nome, email, telefone, senha)
  - **Passo 2**: Upload de documentos (RG/BI, Carta de Condução, Comprovativo de Residência)
  - **Passo 3**: Escolha de veículo disponível
  - **Passo 4**: Visualização e aceite de contrato
- Armazenamento seguro de credenciais (AsyncStorage)
- Mock de autenticação pronto para integração com API real

### 2. **Dashboard (Home)**
- Saudação personalizada com nome do estafeta
- Resumo de entregas do dia (total, em curso, pendentes, concluídas)
- Saldo atual e ganhos do dia
- Avisos importantes da locadora (faturas vencendo, vistorias pendentes)
- Ações rápidas para navegar para Pedidos e Faturas

### 3. **Gestão de Pedidos**
- Lista completa de pedidos atribuídos
- Informações detalhadas: cliente, endereço de recolha, endereço de entrega, distância, valor, janela horária
- Estados do pedido: pendente, aceite, em curso, concluído
- Ações disponíveis:
  - Aceitar ou recusar pedidos pendentes
  - Iniciar entrega de pedidos aceites
  - Concluir entregas em curso
- Design responsivo com cards informativos

### 4. **Mapa Integrado**
- Integração completa com react-native-maps
- Localização em tempo real do estafeta
- Marcadores de todas as entregas ativas no mapa
- Permissões de localização geridas correctamente
- Botão de centralização na localização atual

### 5. **Módulo Locadora (Totalmente Implementado)**

#### 5.1 Resumo do Aluguel
- Informações do veículo atual (modelo, matrícula, status)
- Valor mensal do aluguel
- Data do próximo pagamento
- Status do contrato (ativo/pendente)

#### 5.2 Gestão Financeira
- Lista de faturas (pendentes, pagas, vencidas)
- Detalhes de cada fatura (valor, período, data de vencimento)
- Placeholder para integração com Stripe/PayPal
- Histórico de pagamentos
- Alertas de faturas próximas do vencimento

#### 5.3 Vistorias
- Submissão de fotos do veículo
- Estados: pendente, agendada, aprovada, reprovada
- Histórico de vistorias realizadas
- Notificações de vistorias obrigatórias
- Upload de múltiplas fotos (frente, lateral, traseira, painel)

#### 5.4 Documentos e Contratos
- Visualização de contrato atual
- Acesso a documentos do veículo (seguro, registo)
- Preparado para visualização de PDFs
- Download de documentos

#### 5.5 Chat com Locadora
- Sistema de mensagens bidirecionais
- Suporte para anexos (fotos, PDFs)
- Indicadores de mensagens não lidas
- Timestamps nas mensagens
- Histórico completo de conversas

#### 5.6 Gestão de Veículo
- Histórico de veículos alugados
- Solicitação de troca de veículo
- Atualizações de quilometragem
- Documentação do veículo

### 6. **Perfil do Utilizador**
- Informações pessoais (email, telefone)
- Avatar personalizado
- Acesso a configurações
- Gestão de notificações
- Centro de ajuda e FAQs
- Termos e condições
- Logout seguro

---

## 🔧 Configuração do Projeto

### Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no Rork > Integrations > Environment Variables:

```env
EXPO_PUBLIC_AUTH_API_URL=https://api.motofast.com/auth
EXPO_PUBLIC_DELIVERY_API_URL=https://api.motofast.com/delivery
EXPO_PUBLIC_RENTAL_API_URL=https://api.motofast.com/rental
EXPO_PUBLIC_MAPS_API_KEY=sua-chave-do-google-maps
EXPO_PUBLIC_STRIPE_PUBLIC_KEY=sua-chave-publica-do-stripe
```

> **Nota Importante**: Atualmente, o app funciona com dados mock. Quando os endpoints reais estiverem disponíveis, basta atualizar as URLs acima e o app começará a usar a API real.

---

## 🔌 Contratos da API

### Autenticação

#### `POST /auth/register`
Regista um novo estafeta com todos os documentos.

**Request** (multipart/form-data):
```typescript
{
  name: string;
  email: string;
  phone: string;
  password: string;
  idDocument: File;           // RG ou BI
  drivingLicense: File;       // Carta de condução
  addressProof: File;         // Comprovativo de residência
  vehicleId: string;          // ID do veículo escolhido
}
```

**Response**:
```typescript
{
  success: boolean;
  token: string;              // JWT token
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: 'courier';
    vehicleId: string;
  }
}
```

#### `POST /auth/login`
Autenticação do estafeta.

**Request**:
```typescript
{
  email: string;
  password: string;
}
```

**Response**: Mesmo formato de `/auth/register`

---

### Entregas

#### `GET /couriers/{id}/orders`
Lista todos os pedidos atribuídos ao estafeta.

**Response**:
```typescript
{
  success: boolean;
  data: Array<{
    id: string;
    clientName: string;
    address: string;
    pickupAddress: string;
    distance: number;          // em km
    value: number;             // valor da entrega em €
    timeWindow: string;        // ex: "14:00 - 15:00"
    status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
    lat: number;
    lng: number;
  }>
}
```

#### `POST /orders/{id}/accept`
Aceitar um pedido.

#### `POST /orders/{id}/start`
Iniciar uma entrega.

#### `POST /orders/{id}/complete`
Concluir uma entrega.

**Request** (multipart/form-data):
```typescript
{
  deliveryProof?: File;      // Foto de comprovação (opcional)
}
```

#### `GET /couriers/{id}/summary`
Resumo diário do estafeta.

**Response**:
```typescript
{
  success: boolean;
  data: {
    deliveriesToday: number;
    inProgress: number;
    pending: number;
    completed: number;
    earningsToday: number;     // em €
    balance: number;           // saldo total em €
  }
}
```

---

### Locadora

#### `GET /couriers/{id}/rental`
Informações do aluguel atual.

**Response**:
```typescript
{
  success: boolean;
  data: {
    vehicle: {
      id: string;
      model: string;
      plate: string;
      rentalStatus: 'active' | 'pending' | 'expired';
      monthlyFee: number;      // em €
      nextPayment: string;     // data ISO 8601
    }
  }
}
```

#### `GET /couriers/{id}/invoices`
Lista de todas as faturas.

**Response**:
```typescript
{
  success: boolean;
  data: Array<{
    id: string;
    amount: number;            // em €
    dueDate: string;           // data ISO 8601
    status: 'pending' | 'paid' | 'overdue';
    period: string;            // ex: "Novembro 2025"
    pdfUrl: string;            // URL para download do PDF
  }>
}
```

#### `POST /payments`
Processar um pagamento.

**Request**:
```typescript
{
  invoiceId: string;
  amount: number;
  method: 'credit_card' | 'debit_card' | 'bank_transfer' | 'paypal';
  stripeToken?: string;        // Se usar Stripe
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  paymentId: string;
}
```

#### `GET /vehicles/available`
Lista de veículos disponíveis para aluguel.

**Response**:
```typescript
{
  success: boolean;
  data: Array<{
    id: string;
    model: string;
    monthlyFee: number;
    description: string;
    image?: string;
  }>
}
```

#### `GET /vehicles/{id}/documents`
Documentos de um veículo específico.

**Response**:
```typescript
{
  success: boolean;
  data: Array<{
    type: 'insurance' | 'registration' | 'contract' | 'other';
    name: string;
    url: string;               // URL do PDF
    expiryDate?: string;       // data ISO 8601
  }>
}
```

#### `GET /couriers/{id}/inspections`
Histórico de vistorias.

**Response**:
```typescript
{
  success: boolean;
  data: Array<{
    id: string;
    date: string;              // data ISO 8601
    status: 'pending' | 'scheduled' | 'approved' | 'rejected';
    notes: string;
    vehicleId: string;
    photos: string[];          // URLs das fotos
  }>
}
```

#### `POST /inspections`
Submeter uma nova vistoria.

**Request** (multipart/form-data):
```typescript
{
  vehicleId: string;
  notes: string;
  photoFront: File;
  photoSide: File;
  photoRear: File;
  photoDashboard: File;
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  inspectionId: string;
}
```

#### `GET /couriers/{id}/messages`
Histórico de mensagens com a locadora.

**Response**:
```typescript
{
  success: boolean;
  data: Array<{
    id: string;
    text: string;
    sender: 'courier' | 'rental';
    timestamp: string;         // data ISO 8601
    read: boolean;
    attachments: Array<{
      type: 'image' | 'pdf';
      url: string;
    }>;
  }>
}
```

#### `POST /couriers/{id}/messages`
Enviar mensagem para a locadora.

**Request** (multipart/form-data):
```typescript
{
  text: string;
  attachment?: File;           // Opcional: foto ou PDF
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  messageId: string;
}
```

#### `POST /vehicles/change-request`
Solicitar troca de veículo.

**Request**:
```typescript
{
  currentVehicleId: string;
  newVehicleId: string;
  reason: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  requestId: string;
}
```

---

## 📂 Estrutura do Projeto

```
motofast/
├── app/
│   ├── (tabs)/                # Bottom Tab Navigation
│   │   ├── _layout.tsx       # Configuração das tabs
│   │   ├── index.tsx         # Home/Dashboard
│   │   ├── orders.tsx        # Lista de pedidos
│   │   ├── map.tsx           # Mapa com localização
│   │   ├── rental.tsx        # Módulo da locadora
│   │   └── profile.tsx       # Perfil do utilizador
│   ├── login.tsx             # Tela de login
│   ├── onboarding.tsx        # Registo multi-step
│   ├── _layout.tsx           # Root Layout (providers)
│   └── +not-found.tsx        # Página 404
├── contexts/
│   └── AuthContext.tsx       # Context de autenticação
├── constants/
│   ├── colors.ts             # Paleta de cores do app
│   ├── mockData.ts           # Dados mock para desenvolvimento
│   └── apiEndpoints.ts       # URLs e endpoints da API
├── assets/
│   └── images/               # Ícones e imagens
├── package.json
├── app.json
└── tsconfig.json
```

---

## 🎨 Design System

### Cores Principais
```typescript
{
  primary: '#0066FF',          // Azul principal
  secondary: '#00C853',        // Verde (sucesso/ganhos)
  background: '#F8F9FA',       // Fundo claro
  surface: '#FFFFFF',          // Cards e superfícies
  text: '#1A1A1A',            // Texto principal
  textSecondary: '#6B7280',   // Texto secundário
  success: '#00C853',
  warning: '#FFA726',
  error: '#EF5350',
  info: '#29B6F6',
}
```

### Navegação
- **5 Tabs principais**: Home, Pedidos, Mapa, Locadora, Perfil
- **Header personalizado** em cada tela com título relevante
- **Safe Area** respeitada em todas as telas
- **Navegação por stack** para telas secundárias

---

## 🚀 Próximos Passos para Integração

### 1. Conectar ao Backend Real
No ficheiro `constants/apiEndpoints.ts`, já estão configuradas as URLs base. Quando o backend estiver pronto:

1. Atualize as variáveis de ambiente com as URLs corretas
2. Remova os dados mock de `constants/mockData.ts`
3. Os componentes já estão preparados para consumir a API real

### 2. Implementar Serviço de API com Axios
Crie um ficheiro `services/api.ts`:

```typescript
import axios from 'axios';
import { API_CONFIG } from '@/constants/apiEndpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: API_CONFIG.AUTH_API_URL,
  timeout: 10000,
});

// Interceptor para adicionar token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirecionar para login
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. Implementar React Query Hooks
Exemplo para pedidos:

```typescript
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function useOrders(courierId: string) {
  return useQuery({
    queryKey: ['orders', courierId],
    queryFn: async () => {
      const { data } = await api.get(`/couriers/${courierId}/orders`);
      return data.data;
    },
  });
}
```

### 4. Adicionar Notificações Push
1. Instalar `expo-notifications`
2. Configurar tokens no backend
3. Implementar handlers locais

### 5. Adicionar Tracking GPS Real
1. Usar `expo-location` com watchPositionAsync
2. Enviar posição para backend periodicamente
3. Atualizar UI em tempo real

---

## 🧪 Testar o App

### Dados de Teste (Mock)

**Login**:
- Email: qualquer email
- Senha: qualquer senha
(Actualmente aceita qualquer combinação)

**Dados Mock Disponíveis**:
- 3 pedidos de exemplo com diferentes estados
- 1 veículo alugado: Honda CG 150
- 2 faturas (1 pendente, 1 paga)
- 1 vistoria pendente
- 3 mensagens no chat com a locadora

### Funcionalidades a Testar

1. **Onboarding**:
   - Preencher dados pessoais
   - Fazer upload de documentos (simulado)
   - Ver contrato

2. **Home**:
   - Ver resumo de entregas
   - Ver saldo
   - Clicar em avisos

3. **Pedidos**:
   - Ver lista de pedidos
   - Filtrar por estado
   - Aceitar/Iniciar/Concluir

4. **Mapa**:
   - Permitir localização
   - Ver marcadores
   - Centralizar no estafeta

5. **Locadora**:
   - Ver resumo do aluguel
   - Ver faturas
   - Navegar pelas diferentes opções

6. **Perfil**:
   - Ver informações
   - Fazer logout

---

## 📱 Publicação

Quando estiver pronto para publicar:

1. Atualize `app.json` com:
   - Nome correto do app
   - Bundle identifier único
   - Versão
   - Ícones e splash screen

2. Siga o guia no README.md principal para:
   - Build para iOS (App Store)
   - Build para Android (Google Play)

---

## 🔒 Segurança

- **Nunca** comite chaves de API ou tokens no código
- Use variáveis de ambiente para todas as credenciais
- Tokens JWT armazenados com segurança no AsyncStorage
- Validação de inputs em todos os formulários
- HTTPS obrigatório para todas as chamadas de API

---

## 📞 Contacto & Suporte

Para dúvidas sobre a implementação:
- Documentação Expo: https://docs.expo.dev/
- Documentação React Native: https://reactnative.dev/
- Support Rork: Através da plataforma

---

**Moto Fast** - Entregas rápidas e seguras! 🏍️💨
