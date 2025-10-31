# Environment Variables - Moto Fast

Este documento lista todas as variáveis de ambiente necessárias para o funcionamento completo do aplicativo Moto Fast.

## 📌 Como Configurar

Defina estas variáveis em **Rork > Integrations > Environment Variables** ou crie um arquivo `.env` local para desenvolvimento.

---

## 🔐 Autenticação e Segurança

### JWT_SECRET
- **Descrição**: Chave secreta para assinar access tokens
- **Tipo**: String (mínimo 32 caracteres)
- **Exemplo**: `super-secret-jwt-key-change-this-in-production`
- **Obrigatório**: ✅ Sim

### JWT_EXPIRES_IN
- **Descrição**: Tempo de expiração do access token
- **Tipo**: String (formato: "15m", "1h", "7d")
- **Exemplo**: `15m`
- **Padrão**: `15m`
- **Obrigatório**: ❌ Não

### JWT_REFRESH_SECRET
- **Descrição**: Chave secreta para assinar refresh tokens
- **Tipo**: String (mínimo 32 caracteres)
- **Exemplo**: `super-secret-refresh-token-key-change-this`
- **Obrigatório**: ✅ Sim

### JWT_REFRESH_EXPIRES_IN
- **Descrição**: Tempo de expiração do refresh token
- **Tipo**: String
- **Exemplo**: `30d`
- **Padrão**: `30d`
- **Obrigatório**: ❌ Não

### RESET_TOKEN_SECRET
- **Descrição**: Chave para hash de tokens de recuperação de senha
- **Tipo**: String
- **Exemplo**: `reset-token-secret-key`
- **Obrigatório**: ✅ Sim

### RESET_TOKEN_EXPIRES_HOURS
- **Descrição**: Validade do token de reset em horas
- **Tipo**: Number
- **Exemplo**: `2`
- **Padrão**: `2`
- **Obrigatório**: ❌ Não

### VERIFY_TOKEN_EXPIRES_HOURS
- **Descrição**: Validade do token de verificação de e-mail em horas
- **Tipo**: Number
- **Exemplo**: `24`
- **Padrão**: `24`
- **Obrigatório**: ❌ Não

---

## 🗄️ Banco de Dados

### DATABASE_URL
- **Descrição**: URL de conexão com o banco de dados PostgreSQL/MySQL
- **Tipo**: String (Connection String)
- **Exemplo**: `postgresql://user:password@localhost:5432/motofast`
- **Obrigatório**: ✅ Sim

---

## 📧 E-mail (Amazon SES)

### AWS_REGION
- **Descrição**: Região da AWS para Amazon SES
- **Tipo**: String
- **Exemplo**: `us-east-1`
- **Obrigatório**: ✅ Sim

### AWS_ACCESS_KEY_ID
- **Descrição**: Access Key ID da AWS IAM
- **Tipo**: String
- **Exemplo**: `AKIAIOSFODNN7EXAMPLE`
- **Obrigatório**: ✅ Sim

### AWS_SECRET_ACCESS_KEY
- **Descrição**: Secret Access Key da AWS IAM
- **Tipo**: String (sensível)
- **Exemplo**: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
- **Obrigatório**: ✅ Sim

### EMAIL_FROM
- **Descrição**: E-mail remetente verificado no SES
- **Tipo**: String (email válido)
- **Exemplo**: `no-reply@motofast.com`
- **Obrigatório**: ✅ Sim

### SES_CONFIGURATION_SET
- **Descrição**: Configuration Set do SES (opcional, para tracking)
- **Tipo**: String
- **Exemplo**: `motofast-emails`
- **Obrigatório**: ❌ Não

---

## 🌐 URLs e Endpoints

### EXPO_PUBLIC_RORK_API_BASE_URL
- **Descrição**: URL base da API backend (usada pelo tRPC)
- **Tipo**: String (URL)
- **Exemplo**: `https://your-app.rork.app`
- **Obrigatório**: ✅ Sim

### AUTH_API_URL
- **Descrição**: URL da API de autenticação
- **Tipo**: String (URL)
- **Exemplo**: `https://api.motofast.com/auth`
- **Obrigatório**: ✅ Sim

### DELIVERY_API_URL
- **Descrição**: URL da API de entregas
- **Tipo**: String (URL)
- **Exemplo**: `https://api.motofast.com/delivery`
- **Obrigatório**: ✅ Sim

### RENTAL_API_URL
- **Descrição**: URL da API de locação de motos
- **Tipo**: String (URL)
- **Exemplo**: `https://api.motofast.com/rental`
- **Obrigatório**: ✅ Sim

### FRONTEND_URL
- **Descrição**: URL do frontend (usado em links de e-mail)
- **Tipo**: String (URL)
- **Exemplo**: `https://app.rork.motofast.rork.app`
- **Obrigatório**: ✅ Sim

---

## 🗺️ Mapas e Localização

### EXPO_PUBLIC_MAPS_API_KEY
- **Descrição**: Chave de API do Google Maps
- **Tipo**: String
- **Exemplo**: `AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Obrigatório**: ✅ Sim (para funcionalidade de mapas)

---

## 💳 Pagamentos

### EXPO_PUBLIC_STRIPE_PUBLIC_KEY
- **Descrição**: Chave pública do Stripe
- **Tipo**: String
- **Exemplo**: `pk_test_xxxxxxxxxxxxxxxxxxxxx`
- **Obrigatório**: ✅ Sim (se usar Stripe)

### STRIPE_SECRET_KEY
- **Descrição**: Chave secreta do Stripe (backend only)
- **Tipo**: String (sensível)
- **Exemplo**: `sk_test_xxxxxxxxxxxxxxxxxxxxx`
- **Obrigatório**: ✅ Sim (se usar Stripe)

---

## 🛡️ Rate Limiting (Opcional)

### RATE_LIMIT_WINDOW_MS
- **Descrição**: Janela de tempo para rate limiting (em ms)
- **Tipo**: Number
- **Exemplo**: `900000` (15 minutos)
- **Padrão**: `900000`
- **Obrigatório**: ❌ Não

### RATE_LIMIT_MAX
- **Descrição**: Número máximo de requisições por janela
- **Tipo**: Number
- **Exemplo**: `100`
- **Padrão**: `100`
- **Obrigatório**: ❌ Não

---

## 📦 Storage (Upload de Arquivos)

### AWS_S3_BUCKET
- **Descrição**: Nome do bucket S3 para uploads
- **Tipo**: String
- **Exemplo**: `motofast-uploads`
- **Obrigatório**: ✅ Sim (se usar S3)

### CLOUDFLARE_R2_ENDPOINT
- **Descrição**: Endpoint do Cloudflare R2 (alternativa ao S3)
- **Tipo**: String (URL)
- **Exemplo**: `https://xxxxx.r2.cloudflarestorage.com`
- **Obrigatório**: ❌ Não

---

## 🔔 Notificações Push (Opcional)

### EXPO_PUSH_TOKEN_SECRET
- **Descrição**: Token secreto para Expo Push Notifications
- **Tipo**: String
- **Exemplo**: `xxxxxxxxxxxxxxxxxxxxx`
- **Obrigatório**: ❌ Não (apenas se usar push notifications)

---

## 📊 Ambiente

### NODE_ENV
- **Descrição**: Ambiente de execução
- **Tipo**: String
- **Valores**: `development`, `production`, `test`
- **Exemplo**: `production`
- **Padrão**: `development`
- **Obrigatório**: ❌ Não

---

## ✅ Checklist de Configuração

Antes de colocar em produção, certifique-se de que:

- [ ] Todas as variáveis obrigatórias estão definidas
- [ ] Chaves secretas (`JWT_SECRET`, etc.) são fortes e únicas
- [ ] URLs apontam para os endpoints corretos
- [ ] Amazon SES está configurado e verificado
- [ ] Database URL está correto e o banco está acessível
- [ ] Credenciais da AWS (para SES e S3) têm as permissões corretas
- [ ] Google Maps API Key tem as APIs necessárias ativadas
- [ ] Stripe está configurado (se aplicável)
- [ ] Rate limiting está configurado para evitar abusos

---

## 📝 Exemplo de Arquivo `.env` (Desenvolvimento)

```env
# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=30d
RESET_TOKEN_SECRET=reset-token-secret
RESET_TOKEN_EXPIRES_HOURS=2
VERIFY_TOKEN_EXPIRES_HOURS=24

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/motofast

# Email (Amazon SES)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
EMAIL_FROM=no-reply@motofast.com

# URLs
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8081
AUTH_API_URL=http://localhost:8081/auth
DELIVERY_API_URL=http://localhost:8081/delivery
RENTAL_API_URL=http://localhost:8081/rental
FRONTEND_URL=http://localhost:8081

# Maps
EXPO_PUBLIC_MAPS_API_KEY=your_google_maps_api_key

# Payments
EXPO_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxx

# Storage
AWS_S3_BUCKET=motofast-uploads-dev

# Environment
NODE_ENV=development
```

---

## 🔒 Segurança

**IMPORTANTE**:
- **Nunca** commite arquivos `.env` no git
- Use `.env.example` sem valores sensíveis para documentar variáveis
- Rotacione chaves regularmente em produção
- Use secrets managers (AWS Secrets Manager, etc.) em produção
- Garanta que as credenciais da AWS têm apenas as permissões mínimas necessárias

---

## 📚 Recursos Adicionais

- [Amazon SES Setup Guide](./AMAZON_SES_CONFIG.md)
- [Authentication System](./AUTH_SYSTEM.md)
- [Sistema de Autenticação (PT)](./SISTEMA_AUTENTICACAO.md)
