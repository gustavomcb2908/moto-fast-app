# Testes locais do fluxo de cadastro

1. Configure o arquivo `env` com:
   - EXPO_PUBLIC_SUPABASE_URL
   - EXPO_PUBLIC_SUPABASE_KEY
   - EXPO_PUBLIC_PASSWORD_RESET_REDIRECT (opcional)
   - EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET=motofast-documents

2. Inicie o app:
   - `bun run start-web` (navegador) ou `bun run start`

3. Fluxo de teste:
   - Acesse `/onboarding`
   - Preencha os dados obrigatórios (e-mail válido, senha forte)
   - Anexe documentos e tire a selfie
   - Aceite os termos e pressione "Concluir Cadastro"

4. Comportamento esperado:
   - Botão desabilita e mostra spinner durante o envio
   - Payload montado conforme especificação e enviado ao Supabase Auth
   - Alerta: "Cadastro concluído! Verifique seu e-mail..."
   - Redireciona para `/verify-pending` (com e-mail nos params)

5. Logs de debug (apenas em dev):
   - 🚀 [REGISTER] Botão pressionado - estado atual
   - 🧾 Payload final (flags das imagens true/false)
   - ❌ Erro ao registrar (se ocorrer)
   - ✅ Registro concluído (com e-mail)

6. Observações sobre documentos:
   - Devido às políticas de RLS do Supabase, o upload em Storage ocorre somente após o usuário estar autenticado. No momento do sign-up, os arquivos são processados em base64 e o envio é adiado até a verificação do e-mail.