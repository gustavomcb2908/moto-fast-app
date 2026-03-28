# Módulo de Perfil - Moto Fast

Documentação completa do módulo de **Perfil do Usuário**, incluindo todas as funcionalidades implementadas, estrutura de arquivos, endpoints e instruções de uso.

---

## 📁 Estrutura de Arquivos

```
app/(tabs)/profile/
├── _layout.tsx              # Stack navigation para Profile
├── index.tsx                # Tela principal do perfil (menu)
├── details.tsx              # Edição de informações pessoais
├── settings.tsx             # Configurações e senha
├── notifications.tsx        # Lista de notificações
└── support.tsx              # FAQ e Chat de suporte

constants/
├── notifications.ts         # Mock de notificações e helpers
└── faq.ts                   # Perguntas frequentes (FAQ)

hooks/
└── useProfile.ts            # Hook para gerenciar dados do perfil

backend/trpc/routes/profile/
├── update.ts                # Atualizar perfil
├── change-password.ts       # Alterar senha
├── upload-avatar.ts         # Upload de avatar
├── notifications.ts         # Notificações (get, mark as read)
└── support-messages.ts      # Mensagens de suporte (get, send)
```

---

## 🧩 Funcionalidades

### 1. **Perfil Principal** (`/profile`)
- Avatar do usuário com botão de edição
- Informações rápidas (e-mail, telefone)
- Status de verificação de e-mail
- Status KYC
- Menu de navegação para:
  - Informações Pessoais
  - Definições
  - Notificações (com badge)
  - Ajuda e Suporte
- Botão de logout

### 2. **Informações Pessoais** (`/profile/details`)
- Upload de foto de perfil (câmera ou galeria)
- Campos editáveis:
  - Nome completo
  - Telefone
  - Endereço
  - Data de nascimento
  - Número da carta de condução
- E-mail (não editável, para segurança)
- Card de status KYC com indicador visual
- Botão "Salvar Alterações"

### 3. **Definições** (`/profile/settings`)
- **Notificações Push**: Toggle para ativar/desativar
- **Modo Escuro**: Toggle (em breve)
- **Alterar Senha**:
  - Modal com formulário
  - Validação de senha (mínimo 8 caracteres)
  - Confirmação de senha
- **Autenticação em Dois Fatores** (em breve)
- Dica de segurança

### 4. **Notificações** (`/profile/notifications`)
- Lista de notificações com:
  - Ícone por tipo (entrega, pagamento, vistoria, etc.)
  - Título e descrição
  - Timestamp ("há X minutos")
  - Status lido/não lido
  - Badge de não lidas
- Botão "Marcar todas como lidas"
- Pull-to-refresh
- Deslizar para deletar
- Navegação para ação relacionada (se disponível)

### 5. **Suporte e Ajuda** (`/profile/support`)
#### Tab FAQ:
- Busca de perguntas
- Filtros por categoria
- Lista expansível (accordion)
- 10 perguntas frequentes pré-cadastradas

#### Tab Chat:
- Interface de chat (estilo WhatsApp)
- Envio de mensagens de texto
- Avatar do suporte e do usuário
- Timestamp das mensagens
- Auto-scroll para última mensagem
- Resposta automática de confirmação

---

## 🔌 Endpoints Backend (tRPC)

### `profile.update`
**Tipo**: Mutation  
**Autenticação**: Bearer Token obrigatório  
**Input**:
```typescript
{
  name?: string;        // min 2 caracteres
  phone?: string;
  address?: string;
  birthDate?: string;
  licenseNumber?: string;
}
```
**Output**:
```typescript
{
  success: boolean;
  message: string;
}
```

---

### `profile.changePassword`
**Tipo**: Mutation  
**Autenticação**: Bearer Token obrigatório  
**Input**:
```typescript
{
  currentPassword: string;  // min 8 caracteres
  newPassword: string;      // min 8 caracteres
}
```
**Output**:
```typescript
{
  success: boolean;
  message: string;
}
```

---

### `profile.uploadAvatar`
**Tipo**: Mutation  
**Autenticação**: Bearer Token obrigatório  
**Input**:
```typescript
{
  imageBase64: string;
  mimeType: string;
}
```
**Output**:
```typescript
{
  success: boolean;
  message: string;
  data: {
    avatarUrl: string;
  }
}
```

---

### `profile.getNotifications`
**Tipo**: Query  
**Autenticação**: Bearer Token obrigatório  
**Output**:
```typescript
{
  success: boolean;
  data: Array<{
    id: string;
    type: 'delivery' | 'payment' | 'inspection' | 'message' | 'system';
    title: string;
    description: string;
    timestamp: string;
    read: boolean;
    actionUrl?: string;
  }>
}
```

---

### `profile.markNotificationRead`
**Tipo**: Mutation  
**Autenticação**: Bearer Token obrigatório  
**Input**:
```typescript
{
  notificationId: string;
}
```
**Output**:
```typescript
{
  success: boolean;
  message: string;
}
```

---

### `profile.getSupportMessages`
**Tipo**: Query  
**Autenticação**: Bearer Token obrigatório  
**Output**:
```typescript
{
  success: boolean;
  data: Array<{
    id: string;
    text: string;
    sender: 'user' | 'support';
    timestamp: string;
  }>
}
```

---

### `profile.sendSupportMessage`
**Tipo**: Mutation  
**Autenticação**: Bearer Token obrigatório  
**Input**:
```typescript
{
  text: string;  // min 1, max 500 caracteres
}
```
**Output**:
```typescript
{
  success: boolean;
  message: string;
  data: {
    id: string;
    text: string;
    sender: 'user';
    timestamp: string;
  }
}
```

---

## 🎣 Hook: `useProfile()`

### Importação
```typescript
import { useProfile } from '@/hooks/useProfile';
```

### Retorno
```typescript
{
  profile: User | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  updateProfile: (data: ProfileUpdateData) => void;
  isUpdating: boolean;
  changePassword: (data: ChangePasswordData) => void;
  isChangingPassword: boolean;
  uploadAvatar: (imageUri: string) => void;
  isUploadingAvatar: boolean;
  refetch: () => Promise<void>;
}
```

### Exemplo de Uso
```typescript
const {
  profile,
  isLoading,
  updateProfile,
  isUpdating,
} = useProfile();

const handleSave = () => {
  updateProfile({
    name: 'João Silva',
    phone: '+351 912 345 678',
    address: 'Luanda, Angola',
  });
};
```

---

## 📊 Tipos e Interfaces

### `ProfileUpdateData`
```typescript
interface ProfileUpdateData {
  name?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  licenseNumber?: string;
}
```

### `ChangePasswordData`
```typescript
interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}
```

### `Notification`
```typescript
interface Notification {
  id: string;
  type: 'delivery' | 'payment' | 'inspection' | 'message' | 'system';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}
```

### `FAQItem`
```typescript
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}
```

### `Message`
```typescript
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: string;
  avatar?: string;
}
```

---

## 🧪 Testes Sugeridos

### 1. Navegação
- [ ] Navegar para todas as subpáginas do perfil
- [ ] Voltar funciona em todas as telas
- [ ] Badge de notificações aparece corretamente

### 2. Edição de Perfil
- [ ] Selecionar foto da galeria
- [ ] Tirar foto com câmera
- [ ] Editar nome, telefone, endereço
- [ ] Salvar alterações e verificar sucesso
- [ ] Validação de campos obrigatórios

### 3. Alterar Senha
- [ ] Abrir modal de alteração de senha
- [ ] Validar senha atual
- [ ] Validar nova senha (mínimo 8 caracteres)
- [ ] Confirmar senha
- [ ] Exibir erro se senhas não coincidem
- [ ] Salvar e exibir mensagem de sucesso

### 4. Notificações
- [ ] Listar notificações
- [ ] Marcar como lida ao tocar
- [ ] Marcar todas como lidas
- [ ] Deletar notificação
- [ ] Pull-to-refresh
- [ ] Navegar para ação relacionada

### 5. Suporte
- [ ] Buscar perguntas no FAQ
- [ ] Filtrar por categoria
- [ ] Expandir/colapsar perguntas
- [ ] Enviar mensagem no chat
- [ ] Receber resposta automática
- [ ] Scroll automático para última mensagem

### 6. Logout
- [ ] Clicar em logout
- [ ] Confirmar ação
- [ ] Redirecionar para login
- [ ] Limpar tokens

---

## 🔐 Segurança

### Autenticação
- Todos os endpoints de perfil exigem **Bearer Token** válido
- Tokens são verificados usando `verifyAccessToken()`
- Tokens inválidos ou expirados retornam erro 401

### Validação
- Validação de inputs usando **Zod**
- Senhas nunca são retornadas em respostas
- E-mail não é editável após registro (segurança)

### Rate Limiting
- Endpoints sensíveis (alteração de senha) devem ter rate limiting
- Configurar `RATE_LIMIT_WINDOW_MS` e `RATE_LIMIT_MAX`

---

## 🎨 Design

### Cores (do `constants/colors.ts`)
- **Primary**: `#16A34A` (verde)
- **Surface**: `#FFFFFF` (branco)
- **Text**: `#000000` (preto)
- **Text Secondary**: `#6B7280` (cinza)
- **Error**: `#EF4444` (vermelho)
- **Warning**: `#F59E0B` (laranja)
- **Info**: `#3B82F6` (azul)
- **Success**: `#22C55E` (verde claro)

### Ícones
- Biblioteca: `lucide-react-native`
- Tamanhos: 16px, 20px, 24px

### Espaçamento
- Padding: 8, 12, 16, 24, 32px
- Margin: 8, 12, 16, 24px
- Border Radius: 8, 12, 16, 20px

---

## 🚀 Próximos Passos

### Implementações Futuras
1. **Modo Escuro**: Implementar tema escuro completo
2. **2FA**: Autenticação em dois fatores (TOTP)
3. **Histórico de Atividades**: Log de ações do usuário
4. **Notificações Push**: Integração com Expo Notifications
5. **Upload de Documentos KYC**: Re-upload de documentos rejeitados
6. **Chat em Tempo Real**: WebSockets para suporte ao vivo
7. **Integração com Backend Real**: Substituir mocks por chamadas reais

---

## 📚 Referências

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [tRPC Docs](https://trpc.io/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Lucide Icons](https://lucide.dev/)
- [React Native StyleSheet](https://reactnative.dev/docs/stylesheet)

---

## ✅ Checklist de Implementação

- [x] Estrutura de navegação (Stack dentro de Tab)
- [x] Tela principal do perfil
- [x] Edição de informações pessoais
- [x] Upload de foto de perfil
- [x] Configurações (notificações, senha)
- [x] Lista de notificações
- [x] FAQ expansível com busca e filtros
- [x] Chat de suporte
- [x] Hook `useProfile()` para gerenciar estado
- [x] Backend tRPC routes
- [x] Documentação completa

---

**Status**: ✅ **Módulo completo e pronto para integração**
