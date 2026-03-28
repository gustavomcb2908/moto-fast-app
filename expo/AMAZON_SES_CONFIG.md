# Configuração do Amazon SES para Envio de E-mails

O sistema Moto Fast está configurado para usar **Amazon SES (Simple Email Service)** para envio de e-mails transacionais.

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis de ambiente no Rork > Integrations > Environment Variables:

```env
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
EMAIL_FROM=no-reply@motofast.com
FRONTEND_URL=https://your-app-url.rork.app
```

## Passo a Passo para Configurar o Amazon SES

### 1. Criar Conta AWS
- Acesse [AWS Console](https://console.aws.amazon.com/)
- Crie uma conta ou faça login

### 2. Acessar o Amazon SES
- No console AWS, procure por "SES" ou acesse: https://console.aws.amazon.com/ses/
- Selecione a região desejada (ex: `us-east-1`)

### 3. Verificar Domínio ou E-mail
Para poder enviar e-mails, você precisa verificar seu domínio ou endereço de e-mail:

#### Opção A: Verificar Domínio (Recomendado para Produção)
1. No SES Console, vá em **Verified identities**
2. Clique em **Create identity**
3. Selecione **Domain**
4. Digite seu domínio (ex: `motofast.com`)
5. Adicione os registros DNS fornecidos (TXT, CNAME) no seu provedor de DNS
6. Aguarde a verificação (pode levar até 72h)

#### Opção B: Verificar E-mail (Para Desenvolvimento)
1. No SES Console, vá em **Verified identities**
2. Clique em **Create identity**
3. Selecione **Email address**
4. Digite o e-mail (ex: `no-reply@motofast.com`)
5. Verifique sua caixa de entrada e clique no link de verificação

### 4. Criar Credenciais SMTP
1. No SES Console, vá em **SMTP settings** no menu lateral
2. Clique em **Create SMTP credentials**
3. Digite um nome para as credenciais (ex: `motofast-smtp`)
4. Clique em **Create**
5. **IMPORTANTE:** Baixe ou copie as credenciais:
   - **SMTP Username** (use como `AWS_ACCESS_KEY_ID`)
   - **SMTP Password** (use como `AWS_SECRET_ACCESS_KEY`)

⚠️ **Atenção:** As credenciais SMTP só são exibidas uma vez. Guarde-as em local seguro!

### 5. Sair do Sandbox (Produção)
Por padrão, contas SES novas estão em "Sandbox mode", que limita:
- Envio apenas para e-mails verificados
- Limite de 200 e-mails/dia
- Limite de 1 e-mail/segundo

Para produção:
1. No SES Console, vá em **Account dashboard**
2. Clique em **Request production access**
3. Preencha o formulário explicando seu caso de uso
4. Aguarde aprovação da AWS (geralmente 24h)

### 6. Configurar Bounce e Complaint Handling (Opcional mas Recomendado)
1. Configure SNS topics para receber notificações de bounces e complaints
2. Isso ajuda a manter boa reputação do sender

## Teste de Configuração

### Modo de Desenvolvimento (Sem AWS SES)
Se as credenciais AWS não estiverem configuradas, o sistema usa automaticamente **Ethereal Email** (e-mails de teste):

```bash
📧 No AWS SES credentials found, creating test account...
✅ Using Ethereal test email account: [email]
📧 Preview URL: https://ethereal.email/message/[id]
```

Os e-mails podem ser visualizados através da URL de preview nos logs.

### Modo de Produção (Com AWS SES)
Quando as credenciais estão configuradas:

```bash
✅ Using Amazon SES for email delivery
✅ Verification email sent: [messageId]
```

## Custos

### Preços do Amazon SES
- **Primeiros 62.000 e-mails/mês:** GRATUITO (se enviado de aplicação hospedada na AWS)
- **Envios externos:** $0.10 por 1.000 e-mails
- **E-mails recebidos:** $0.10 por 1.000 e-mails

💡 Para a maioria dos apps pequenos/médios, os custos são mínimos!

## Tipos de E-mails Enviados pelo Sistema

1. **E-mail de Verificação** - Após registro de novo usuário
2. **Redefinição de Senha** - Quando usuário solicita recuperação
3. **KYC Aprovado** - Quando verificação de identidade é aprovada
4. **Notificações de Faturas** - Avisos de vencimento
5. **Mensagens da Locadora** - Comunicações administrativas

## Troubleshooting

### Erro: "Email address is not verified"
- Certifique-se de que o e-mail/domínio está verificado no SES
- Se em Sandbox, ambos remetente E destinatário devem estar verificados

### Erro: "Daily sending quota exceeded"
- Você atingiu o limite diário
- Solicite aumento de quota no SES Console
- Ou aguarde reset (às 00:00 UTC)

### Erro: "Invalid credentials"
- Verifique se `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` estão corretos
- Certifique-se de usar credenciais SMTP (não IAM Access Keys)

### E-mails caindo em spam
- Configure SPF, DKIM e DMARC no DNS
- Use domínio verificado
- Evite conteúdo suspeito nos e-mails
- Monitore bounce/complaint rates

## Segurança

✅ **Boas Práticas:**
- Nunca commite credenciais no código
- Use variáveis de ambiente
- Rotacione credenciais periodicamente
- Use IAM policies restritas
- Monitore logs de envio
- Configure alarmes para bounce rates altos

## Alternativas ao Amazon SES

Se preferir outras soluções:
- **SendGrid** - Até 100 e-mails/dia grátis
- **Mailgun** - Até 5.000 e-mails/mês grátis
- **Postmark** - Focado em e-mails transacionais
- **Resend** - API moderna, simples

Para trocar o provider, basta ajustar `backend/lib/email.ts` mantendo a mesma interface das funções.

## Suporte

- [Documentação AWS SES](https://docs.aws.amazon.com/ses/)
- [AWS SES Pricing](https://aws.amazon.com/ses/pricing/)
- [AWS Support](https://console.aws.amazon.com/support/)
