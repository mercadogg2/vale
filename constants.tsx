
import { Professional, SubscriptionPlan } from './types';

export const CITIES = ['Registro', 'Iguape', 'Sete Barras', 'Cajati', 'Cananéia', 'Jacupiranga', 'Eldorado'];

export const SERVICES = [
  'Reparos Domésticos',
  'Limpeza e Diarista',
  'Elétrica',
  'Hidráulica',
  'Pintura',
  'Jardinagem',
  'Montagem de Móveis',
  'Marido de Aluguel'
];

export const MOCK_PROS: Professional[] = [
  {
    id: '1',
    name: 'Carlos Oliveira',
    photo: 'https://picsum.photos/seed/carlos/200',
    description: 'Eletricista com 15 anos de experiência. Especialista em instalações residenciais e industriais.',
    services: ['Elétrica', 'Reparos Domésticos', 'Marido de Aluguel'],
    cities: ['Sete Barras', 'Registro'],
    verified: true,
    verificationStatus: 'verified',
    rating: 4.9,
    reviewCount: 124,
    plan: SubscriptionPlan.PREMIUM,
    basePrice: 150,
    credits: 500, // Saldo inicial
    reviews: [
        { id: 'r1', author: 'Fernanda S.', rating: 5, comment: 'Excelente profissional! Chegou no horário e resolveu o curto-circuito rapidamente.', date: '10/05/2024' },
        { id: 'r2', author: 'Roberto M.', rating: 5, comment: 'Muito educado e limpo. Recomendo para todos em Registro.', date: '02/05/2024' },
        { id: 'r3', author: 'Cláudia K.', rating: 4, comment: 'Bom serviço, mas demorou um pouco para agendar.', date: '20/04/2024' }
    ]
  },
  {
    id: '2',
    name: 'Ana Maria Silva',
    photo: 'https://picsum.photos/seed/anamaria/200',
    description: 'Diarista detalhista e confiável. Atendimento ágil em toda a região.',
    services: ['Limpeza e Diarista'],
    cities: ['Registro', 'Jacupiranga'],
    verified: true,
    verificationStatus: 'verified',
    rating: 4.8,
    reviewCount: 89,
    plan: SubscriptionPlan.PLUS,
    basePrice: 180,
    credits: 200,
    reviews: [
        { id: 'r1', author: 'Patrícia L.', rating: 5, comment: 'Minha casa nunca ficou tão limpa. A Ana é um anjo!', date: '15/05/2024' },
        { id: 'r2', author: 'Marcelo D.', rating: 5, comment: 'Confiança total. Deixo a chave com ela sem preocupações.', date: '10/05/2024' }
    ]
  },
  {
    id: '3',
    name: 'José Pinturas',
    photo: 'https://picsum.photos/seed/jose/200',
    description: 'Pintura residencial e comercial. Grafiato e texturas.',
    services: ['Pintura'],
    cities: ['Iguape', 'Cananéia'],
    verified: false,
    verificationStatus: 'unverified',
    rating: 4.5,
    reviewCount: 45,
    plan: SubscriptionPlan.GRATIS,
    basePrice: 200,
    credits: 0,
    reviews: [
        { id: 'r1', author: 'Pousada Recanto', rating: 4, comment: 'Fez a pintura da fachada. Ficou bom, preço justo.', date: '12/04/2024' }
    ]
  },
  {
    id: '4',
    name: 'Marcos Hidráulica',
    photo: 'https://picsum.photos/seed/marcos/200',
    description: 'Caça vazamentos e manutenção hidráulica completa.',
    services: ['Hidráulica', 'Reparos Domésticos'],
    cities: ['Registro', 'Cajati'],
    verified: true,
    verificationStatus: 'verified',
    rating: 4.7,
    reviewCount: 67,
    plan: SubscriptionPlan.PLUS,
    basePrice: 120,
    credits: 150,
    reviews: [
        { id: 'r1', author: 'João Pedro', rating: 5, comment: 'Salvou minha cozinha de um alagamento. Rápido demais!', date: '18/05/2024' },
        { id: 'r2', author: 'Maria T.', rating: 4, comment: 'Bom técnico.', date: '05/05/2024' }
    ]
  }
];
