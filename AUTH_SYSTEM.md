# Sistema de Autenticação Completo - Moto Fast

## Visão Geral

O Moto Fast possui um sistema de autenticação completo e seguro, incluindo:

- ✅ Registro com validação de dados
- ✅ Login com JWT + Refresh Tokens
- ✅ Verificação de e-mail
- ✅ Recuperação de senha com link por e-mail
- ✅ Sistema de KYC (Know Your Customer)
- ✅ Tokens seguros e criptografados
- ✅ Logs de auditoria

## Variáveis de Ambiente

Configure estas variáveis em **Rork > Integrations > Environment Variables**:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=30d

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=no-reply@motofast.com

# Frontend URL (for email links)
FRONTEND_URL=https://your-app.rork.app
EXPO_PUBLIC_FRONTEND_URL=https://your-app.rork.app

# Token Expiration
RESET_TOKEN_EXPIRES_HOURS=2
VERIFY_TOKEN_EXPIRES_HOURS=24
```

### Configuração de E-mail (Gmail exemplo)

1. Acesse sua conta Google
2. Ative autenticação de 2 fatores
3. Gere uma "Senha de app" em: https://myaccount.google.com/apppasswords
4. Use essa senha no `SMTP_PASS`

**Nota:** Se não configurar SMTP, o sistema usará **Ethereal Email** (test email service) automaticamente e mostrará os links no console.

## Endpoints da API (tRPC)

### 1. Registro (`auth.register`)

Cria uma nova conta e envia e-mail de verificação.

```typescript
const result = await trpcClient.auth.register.mutate({
  name: "João Silva",
  email: "joao@example.com",
  phone: "+351912345678",
  password: "senha123456",
  accept_terms: true,
  documents: {
    id_document: "base64...",
    driver_license: "base64...",
    proof_of_address: "base64...",
    selfie: "base64...",
  },
});
```

**Resposta:**
```json
{
  "success": true,
  "message": "Conta criada com sucesso! Por favor, verifique o seu e-mail.",
  "userId": "u_1234567890_abc123"
}
```

### 2. Login (`auth.login`)

Faz login e retorna access token + refresh token.

```typescript
const result = await trpcClient.auth.login.mutate({
  email: "joao@example.com",
  password: "senha123456",
});
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900,
    "user": {
      "id": "u_123",
      "name": "João Silva",
      "email": "joao@example.com",
      "phone": "+351912345678",
      "kyc_status": "pending",
      "email_verified": true
    }
  }
}
```

### 3. Verificar E-mail (`auth.verifyEmail`)

Verifica o e-mail usando o token enviado.

```typescript
const result = await trpcClient.auth.verifyEmail.mutate({
  email: "joao@example.com",
  token: "abc123token..."
});
```

### 4. Reenviar Verificação (`auth.resendVerification`)

Reenvia o e-mail de verificação.

```typescript
const result = await trpcClient.auth.resendVerification.mutate({
  email: "joao@example.com"
});
```

### 5. Recuperar Senha (`auth.recover`)

Envia e-mail com link para redefinir senha.

```typescript
const result = await trpcClient.auth.recover.mutate({
  email: "joao@example.com"
});
```

### 6. Redefinir Senha (`auth.resetPassword`)

Redefine a senha usando o token recebido por e-mail.

```typescript
const result = await trpcClient.auth.resetPassword.mutate({
  email: "joao@example.com",
  token: "reset_token_from_email",
  newPassword: "novaSenha123"
});
```

### 7. Refresh Token (`auth.refresh`)

Renova o access token usando refresh token.

```typescript
const result = await trpcClient.auth.refresh.mutate({
  refreshToken: "current_refresh_token"
});
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token",
    "expiresIn": 900
  }
}
```

### 8. Logout (`auth.logout`)

Revoga o refresh token (logout).

```typescript
const result = await trpcClient.auth.logout.mutate({
  refreshToken: "current_refresh_token"
});
```

### 9. Me (`auth.me`)

Obtém dados do usuário autenticado (requer header Authorization).

```typescript
// No tRPC client, o header é enviado automaticamente se configurado
const result = await trpcClient.auth.me.query();
```

**Header necessário:**
```
Authorization: Bearer <access_token>
```

## Uso no App (React Native)

### Hook useAuth

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    verifyEmail,
    resendVerification,
    recoverPassword,
    resetPassword,
    logout,
    refreshTokens,
    refreshUserData,
  } = useAuth();

  // Exemplo de login
  const handleLogin = async () => {
    const result = await login('email@example.com', 'password123');
    if (result.success) {
      console.log('Login successful!');
    } else {
      console.error('Login failed:', result.error);
    }
  };

  // Exemplo de registro
  const handleRegister = async () => {
    const result = await register({
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '+351912345678',
      password: 'senha123',
      accept_terms: true,
    });
    
    if (result.success) {
      console.log('Registration successful, check email!');
    }
  };

  return (
    <View>
      {isLoading ? (
        <ActivityIndicator />
      ) : isAuthenticated ? (
        <Text>Bem-vindo, {user?.name}!</Text>
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}
    </View>
  );
}
```

## Fluxos de Autenticação

### Fluxo de Registro

1. Usuário preenche formulário de registro
2. App chama `register()` com dados
3. Backend cria conta com `email_verified: false`
4. Backend gera token de verificação e envia e-mail
5. Usuário clica no link no e-mail → `/verify-email?token=...&email=...`
6. App chama `verifyEmail()`
7. Backend marca `email_verified: true`
8. Usuário pode fazer login

### Fluxo de Login

1. Usuário insere e-mail e senha
2. App chama `login()`
3. Backend valida credenciais
4. Backend verifica se `email_verified === true`
5. Backend gera access token (15min) e refresh token (30 dias)
6. Tokens são guardados em AsyncStorage
7. App redireciona para Home

### Fluxo de Recuperação de Senha

1. Usuário clica "Esqueceu a senha?"
2. Insere e-mail → App chama `recoverPassword()`
3. Backend gera token de reset e envia e-mail
4. Usuário clica no link → `/reset-password?token=...&email=...`
5. Usuário insere nova senha
6. App chama `resetPassword()`
7. Backend atualiza senha e revoga todos refresh tokens
8. Usuário faz login com nova senha

### Fluxo de Refresh Token

1. Access token expira (15 minutos)
2. App intercepta erro 401
3. App chama automaticamente `refreshTokens()`
4. Backend valida refresh token
5. Backend gera novo access token e refresh token
6. Tokens são atualizados no AsyncStorage
7. Request original é repetido com novo token

Se refresh falhar → logout automático

## Segurança

### Passwords

- Hashed com **bcrypt** (cost factor 12)
- Nunca armazenadas em plain text
- Nunca enviadas por e-mail

### Tokens

- **Access Token:** JWT, válido por 15 minutos
- **Refresh Token:** JWT, válido por 30 dias, armazenado hashed no DB
- **One-Time Tokens:** SHA-256 hash, expiração configurável

### Validações

- E-mail format validation
- Senha mínima: 8 caracteres
- Rate limiting (recomendado para produção)
- Tokens expiram automaticamente
- Refresh tokens podem ser revogados

### Headers de Segurança

Para rotas protegidas, envie:

```
Authorization: Bearer <access_token>
```

## Banco de Dados (Mock)

O sistema usa AsyncStorage como mock database para desenvolvimento. Em produção, substitua por:

- PostgreSQL
- MySQL
- MongoDB
- Supabase
- Firebase

### Estrutura de Dados

**users**
```typescript
{
  id: string
  name: string
  email: string (unique)
  phone: string
  password_hash: string
  email_verified: boolean
  kyc_status: 'pending' | 'approved' | 'rejected'
  documents: {
    id_document?: string
    driver_license?: string
    proof_of_address?: string
    selfie?: string
  }
  created_at: string
  updated_at: string
  last_login_at?: string
}
```

**refresh_tokens**
```typescript
{
  id: string
  user_id: string
  token_hash: string
  expires_at: string
  device?: string
  revoked_at?: string
  created_at: string
}
```

**onetime_tokens**
```typescript
{
  id: string
  user_id: string
  token_hash: string
  type: 'verify' | 'reset'
  expires_at: string
  used_at?: string
  created_at: string
}
```

## E-mails

O sistema envia 3 tipos de e-mail:

### 1. Verificação de E-mail
- **Assunto:** "Verifique seu e-mail - Moto Fast"
- **Link:** `${FRONTEND_URL}/verify-email?token=...&email=...`
- **Validade:** 24 horas

### 2. Recuperação de Senha
- **Assunto:** "Redefinir senha - Moto Fast"
- **Link:** `${FRONTEND_URL}/reset-password?token=...&email=...`
- **Validade:** 2 horas

### 3. KYC Aprovado
- **Assunto:** "Verificação aprovada - Moto Fast"
- **Conteúdo:** Notificação de aprovação

### Visualizar E-mails em Dev

Se não configurar SMTP real, o console mostrará:

```
✅ Verification email sent: <message_id>
📧 Preview URL: https://ethereal.email/message/xxxxx
```

Abra o link para ver o e-mail completo.

## Testes

### Teste Manual (Postman/Insomnia)

1. **Registro:**
   ```
   POST /api/trpc/auth.register
   Body: { name, email, phone, password, accept_terms: true }
   ```

2. **Verificar e-mail (copie token do console):**
   ```
   POST /api/trpc/auth.verifyEmail
   Body: { email, token }
   ```

3. **Login:**
   ```
   POST /api/trpc/auth.login
   Body: { email, password }
   → Guarde accessToken e refreshToken
   ```

4. **Get Me:**
   ```
   GET /api/trpc/auth.me
   Header: Authorization: Bearer <accessToken>
   ```

5. **Refresh:**
   ```
   POST /api/trpc/auth.refresh
   Body: { refreshToken }
   ```

6. **Logout:**
   ```
   POST /api/trpc/auth.logout
   Body: { refreshToken }
   ```

## Próximos Passos

### Para Produção

1. **Substituir AsyncStorage por DB real** (Postgres, MySQL, etc.)
2. **Configurar SMTP real** (SendGrid, Mailgun, Amazon SES)
3. **Adicionar rate limiting** (ex: 5 tentativas de login por 15 min)
4. **Implementar 2FA** (opcional)
5. **Logs de auditoria** em DB persistente
6. **Monitoring** (Sentry, LogRocket)
7. **HTTPS obrigatório**
8. **Environment variables seguras** (não commitar secrets)

### Melhorias Opcionais

- [ ] Login social (Google, Facebook, Apple)
- [ ] Biometria (Face ID, Touch ID)
- [ ] Remember me
- [ ] Session management (listar devices ativos)
- [ ] Notificações push de segurança
- [ ] Histórico de login

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console
2. Verifique os links de e-mail (Ethereal Email em dev)
3. Confirme variáveis de ambiente
4. Teste endpoints individualmente

---

**Desenvolvido para Moto Fast** 🏍️
