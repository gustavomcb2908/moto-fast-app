export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'Como alterar meus dados pessoais?',
    answer:
      'Para alterar seus dados, acesse a seção "Perfil" no menu inferior, depois toque em "Informações Pessoais". Você poderá editar seu nome, telefone, endereço e outros dados. Não esqueça de clicar em "Salvar Alterações" ao finalizar.',
    category: 'Conta',
  },
  {
    id: '2',
    question: 'Como realizar o pagamento do aluguel da moto?',
    answer:
      'Vá até a aba "Locadora" e toque em "Pagamentos". Selecione a fatura que deseja pagar e escolha o método de pagamento (Multicaixa Express, Transferência Bancária ou Cartão). Após confirmar, você receberá um comprovante por e-mail.',
    category: 'Pagamentos',
  },
  {
    id: '3',
    question: 'O que fazer se minha moto apresentar problema?',
    answer:
      'Em caso de problemas mecânicos, entre em contato imediatamente com o suporte através do chat disponível em "Perfil > Suporte". Descreva o problema e envie fotos se possível. Nossa equipe irá orientá-lo sobre os próximos passos e, se necessário, agendar uma manutenção.',
    category: 'Manutenção',
  },
  {
    id: '4',
    question: 'Como funciona o processo de vistoria?',
    answer:
      'A vistoria é realizada mensalmente para garantir o bom estado da moto. Você será notificado com antecedência sobre a data e hora. Durante a vistoria, verificamos o estado geral do veículo, documentação e quilometragem. O processo leva cerca de 30 minutos.',
    category: 'Vistoria',
  },
  {
    id: '5',
    question: 'Como redefinir minha senha?',
    answer:
      'Na tela de login, toque em "Esqueci minha senha". Digite seu e-mail cadastrado e você receberá um link para redefinir sua senha. O link é válido por 2 horas. Se não receber o e-mail, verifique sua caixa de spam ou tente reenviar.',
    category: 'Segurança',
  },
  {
    id: '6',
    question: 'Como aceitar uma nova entrega?',
    answer:
      'Quando uma nova entrega estiver disponível, você receberá uma notificação. Acesse a aba "Pedidos" e toque na entrega para ver os detalhes. Se aceitar, toque em "Aceitar Entrega" e siga as instruções de navegação para o local de recolha.',
    category: 'Entregas',
  },
  {
    id: '7',
    question: 'Quanto tempo leva para aprovar meu KYC?',
    answer:
      'O processo de verificação KYC leva em média 24 a 48 horas úteis. Durante este período, nossa equipe analisa seus documentos (BI, Carta de Condução, Comprovante de Residência e Selfie). Você será notificado por e-mail assim que a análise for concluída.',
    category: 'KYC',
  },
  {
    id: '8',
    question: 'Posso trocar de moto durante o contrato?',
    answer:
      'Sim, você pode solicitar a troca de moto em casos específicos, como problemas recorrentes ou necessidade de um modelo diferente. Acesse "Locadora > Trocar Veículo" e preencha o formulário. A solicitação será analisada pela equipe e você receberá uma resposta em até 3 dias úteis.',
    category: 'Locação',
  },
  {
    id: '9',
    question: 'Como funciona o sistema de notificações?',
    answer:
      'Você receberá notificações sobre: novas entregas, pagamentos recebidos, vistorias agendadas, mensagens do suporte e atualizações do sistema. Para gerenciar suas notificações, acesse "Perfil > Definições > Notificações".',
    category: 'App',
  },
  {
    id: '10',
    question: 'O que fazer se não receber uma entrega?',
    answer:
      'Se você aceitou uma entrega mas não a recebeu, entre em contato com o suporte imediatamente. Forneça o número da entrega e descreva o problema. Não inicie o trajeto sem ter o pacote em mãos para evitar problemas.',
    category: 'Entregas',
  },
];

export function getFAQCategories(): string[] {
  const categories = Array.from(new Set(faqData.map((item) => item.category)));
  return ['Todos', ...categories];
}

export function filterFAQByCategory(category: string): FAQItem[] {
  if (category === 'Todos') {
    return faqData;
  }
  return faqData.filter((item) => item.category === category);
}
