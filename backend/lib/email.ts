import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.ethereal.email';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@motofast.com';
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.EXPO_PUBLIC_FRONTEND_URL || 'http://localhost:8081';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (!SMTP_USER || !SMTP_PASS) {
    console.log('📧 No SMTP credentials found, creating test account...');
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    console.log('✅ Using Ethereal test email account:', testAccount.user);
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16A34A; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #16A34A; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏍️ Moto Fast</h1>
          </div>
          <div class="content">
            <h2>Olá ${name}!</h2>
            <p>Bem-vindo ao Moto Fast! Para completar o seu registo, por favor verifique o seu e-mail clicando no botão abaixo:</p>
            <div style="text-align: center;">
              <a href="${verifyUrl}" class="button">Verificar E-mail</a>
            </div>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px;">${verifyUrl}</p>
            <p><strong>Este link expira em 24 horas.</strong></p>
            <p>Se não criou uma conta no Moto Fast, pode ignorar este e-mail.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Moto Fast. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: `"Moto Fast" <${EMAIL_FROM}>`,
      to: email,
      subject: 'Verifique seu e-mail - Moto Fast',
      html,
    });

    console.log('✅ Verification email sent:', info.messageId);
    if (info.messageId.includes('ethereal')) {
      console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16A34A; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #16A34A; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏍️ Moto Fast</h1>
          </div>
          <div class="content">
            <h2>Redefinir Senha</h2>
            <p>Olá ${name},</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para continuar:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Redefinir Senha</a>
            </div>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px;">${resetUrl}</p>
            <p><strong>Este link expira em 2 horas.</strong></p>
            <div class="warning">
              <strong>⚠️ Importante:</strong> Se não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanecerá inalterada.
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2025 Moto Fast. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: `"Moto Fast" <${EMAIL_FROM}>`,
      to: email,
      subject: 'Redefinir senha - Moto Fast',
      html,
    });

    console.log('✅ Password reset email sent:', info.messageId);
    if (info.messageId.includes('ethereal')) {
      console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendKYCApprovedEmail(email: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16A34A; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .success { background: #D1FAE5; border-left: 4px solid #10B981; padding: 12px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏍️ Moto Fast</h1>
          </div>
          <div class="content">
            <h2>✅ Verificação Aprovada!</h2>
            <p>Olá ${name},</p>
            <div class="success">
              <strong>Parabéns!</strong> A sua verificação de identidade (KYC) foi aprovada com sucesso.
            </div>
            <p>Agora você tem acesso completo a todos os recursos do Moto Fast, incluindo:</p>
            <ul>
              <li>🏍️ Aluguer de motos</li>
              <li>📦 Aceitar entregas</li>
              <li>💰 Gestão financeira</li>
              <li>📄 Contratos e documentos</li>
            </ul>
            <p>Comece já a trabalhar e boa sorte nas suas entregas!</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Moto Fast. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: `"Moto Fast" <${EMAIL_FROM}>`,
      to: email,
      subject: 'Verificação aprovada - Moto Fast',
      html,
    });

    console.log('✅ KYC approved email sent:', info.messageId);
    if (info.messageId.includes('ethereal')) {
      console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send KYC approved email:', error);
    return { success: false };
  }
}
