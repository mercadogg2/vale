import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { ProCard } from './components/ProCard';
import { UserRole, Professional, Booking, VerificationStatus, ReputationLevel, SubscriptionPlan, Plan, ServiceRequest } from './types';
import { MOCK_PROS, SERVICES as SERVICE_CONSTANTS, CITIES as CITY_CONSTANTS } from './constants';
import { getSmartServiceEstimate } from './services/geminiService';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie } from 'recharts';

// --- MOCK INITIAL DATA ---
const INITIAL_REQUESTS: ServiceRequest[] = [
    { 
        id: 'r1', 
        clientId: 'c1', 
        category: 'Pintura', 
        city: 'Registro', 
        description: 'Preciso pintar a fachada de um sobrado de dois andares. Aproximadamente 120m². Paredes externas apenas.', 
        urgency: 'medium', 
        status: 'open', 
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        contactPhone: '13999999999',
        unlockedBy: []
    },
    { 
        id: 'r2', 
        clientId: 'c2', 
        category: 'Elétrica', 
        city: 'Iguape', 
        description: 'Troca completa da fiação de um chuveiro que está desarmando o disjuntor constantemente. Preciso com urgência pois é o único banheiro.', 
        urgency: 'high', 
        status: 'open', 
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        contactPhone: '13988888888',
        unlockedBy: []
    },
    { 
        id: 'r3', 
        clientId: 'c3', 
        category: 'Jardinagem', 
        city: 'Sete Barras', 
        description: 'Corte de grama e poda de 3 árvores de médio porte no quintal. Retirada do entulho inclusa.', 
        urgency: 'low', 
        status: 'open', 
        createdAt: new Date(Date.now() - 43200000).toISOString(),
        contactPhone: '13977777777',
        unlockedBy: []
    }
];

const INITIAL_BOOKINGS: Booking[] = [
    {
        id: 'b1',
        proId: '1',
        clientId: 'me',
        clientName: 'Você',
        proName: 'Carlos Oliveira',
        service: 'Instalação Elétrica',
        status: 'accepted',
        date: '2024-05-25',
        price: 150
    },
    {
        id: 'b2',
        proId: '2',
        clientId: 'me',
        clientName: 'Você',
        proName: 'Ana Maria Silva',
        service: 'Limpeza Pesada',
        status: 'pending',
        date: '2024-05-28',
        price: 200
    }
];

const INITIAL_PLANS: Plan[] = [
  {
    id: 'gratis',
    name: 'Grátis',
    price: '0,00',
    period: 'mês',
    fee: '15%',
    color: 'bg-slate-100 border-slate-200',
    buttonColor: 'bg-slate-600',
    features: ['Perfil Básico', 'Máximo 3 serviços', 'Taxa de 15% por serviço'],
    recommended: false
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '29,90',
    period: 'mês',
    fee: '10%',
    color: 'bg-blue-50 border-blue-200',
    buttonColor: 'bg-blue-600',
    features: ['Perfil Destacado', 'Serviços Ilimitados', 'Taxa de 10% por serviço', 'Selo de Verificação'],
    recommended: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '59,90',
    period: 'mês',
    fee: '5%',
    color: 'bg-amber-50 border-amber-200',
    buttonColor: 'bg-amber-600',
    features: ['Topo das Buscas', 'Taxa de 5% por serviço', 'Suporte Prioritário', 'Gestão de Equipe'],
    recommended: false
  }
];

// --- UI Components Helpers ---

// Toast Notification System
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ToastContainer: React.FC<{ toasts: Toast[], removeToast: (id: number) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          onClick={() => removeToast(toast.id)}
          className={`min-w-[300px] p-4 rounded-xl shadow-xl text-sm font-bold text-white cursor-pointer animate-in slide-in-from-right fade-in duration-300 flex items-center justify-between ${
            toast.type === 'success' ? 'bg-green-600' : 
            toast.type === 'error' ? 'bg-red-500' : 'bg-blue-600'
          }`}
        >
          <span>{toast.message}</span>
          <span className="opacity-70 hover:opacity-100">✕</span>
        </div>
      ))}
    </div>
  );
};

// Booking Modal Component
interface BookingModalProps {
  pro: Professional;
  onClose: () => void;
  onConfirm: (details: { date: string; time: string; address: string; description: string }) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ pro, onClose, onConfirm }) => {
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState({ date: '', time: '', address: '', description: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(details);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
             <h3 className="text-xl font-black text-slate-800">Agendar Serviço</h3>
             <p className="text-sm text-slate-500">com {pro.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-300">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data Preferida</label>
                <input 
                  required
                  type="date" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={details.date}
                  onChange={e => setDetails({...details, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Horário Aproximado</label>
                <select 
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={details.time}
                  onChange={e => setDetails({...details, time: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  <option value="Manhã (08:00 - 12:00)">Manhã (08:00 - 12:00)</option>
                  <option value="Tarde (13:00 - 18:00)">Tarde (13:00 - 18:00)</option>
                  <option value="Noite (Após 18:00)">Noite (Após 18:00)</option>
                </select>
              </div>
              <div className="pt-4">
                <button 
                  type="button" 
                  onClick={() => setStep(2)} 
                  disabled={!details.date || !details.time}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                >
                  Continuar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
               <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Endereço do Serviço</label>
                <input 
                  required
                  type="text" 
                  placeholder="Rua, Número, Bairro, Cidade"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={details.address}
                  onChange={e => setDetails({...details, address: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descrição do Problema</label>
                <textarea 
                  required
                  placeholder="Descreva brevemente o que precisa ser feito..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                  value={details.description}
                  onChange={e => setDetails({...details, description: e.target.value})}
                />
              </div>

              <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex gap-3 items-start">
                 <div className="text-green-600 text-xl mt-0.5">🛡️</div>
                 <div>
                    <h4 className="text-sm font-bold text-green-800">Pagamento Protegido</h4>
                    <p className="text-xs text-green-700/80 leading-relaxed">
                       Seu pagamento fica no cofre do Vale Conecta e só é liberado ao profissional após a conclusão do serviço. Garantia contra imprevistos.
                    </p>
                 </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="w-1/3 bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Voltar
                </button>
                <button 
                  type="submit"
                  disabled={!details.address || !details.description}
                  className="w-2/3 bg-green-600 text-white py-4 rounded-xl font-bold disabled:opacity-50 hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

// --- Proposal Modal ---
interface ProposalModalProps {
  request: ServiceRequest;
  onClose: () => void;
  onConfirm: (details: { description: string; price: number; timeline: string }) => void;
}

const ProposalModal: React.FC<ProposalModalProps> = ({ request, onClose, onConfirm }) => {
    const [formData, setFormData] = useState({
        description: '',
        price: '' as any,
        timeline: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm({
            description: formData.description,
            price: Number(formData.price),
            timeline: formData.timeline
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-800">Enviar Proposta</h3>
                        <p className="text-sm text-slate-500">Para o pedido #{request.id.slice(-4)}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-300">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descrição da Proposta</label>
                        <textarea 
                            required
                            placeholder="Descreva exatamente o que você fará, materiais inclusos, etc..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Valor Total (R$)</label>
                            <input 
                                required
                                type="number"
                                placeholder="0,00"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.price}
                                onChange={e => setFormData({...formData, price: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Prazo Estimado</label>
                            <input 
                                required
                                type="text"
                                placeholder="Ex: 2 dias, 4 horas"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.timeline}
                                onChange={e => setFormData({...formData, timeline: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-xs text-amber-800">
                        ⚠️ <strong>Importante:</strong> Ao enviar, o cliente receberá sua proposta detalhada e poderá realizar o pagamento em garantia (Escrow) para iniciar o serviço.
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="w-1/3 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="w-2/3 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                        >
                            Enviar Proposta
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Mercado Pago Payment Simulation Modal ---
interface PaymentModalProps {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ booking, onClose, onSuccess }) => {
    const [method, setMethod] = useState<'pix' | 'card'>('pix');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'selection' | 'processing' | 'success'>('selection');

    const handlePay = () => {
        setLoading(true);
        // Simulate API call to Mercado Pago
        setTimeout(() => {
            setLoading(false);
            setStep('success');
            setTimeout(() => {
                onSuccess();
            }, 1500);
        }, 2000);
    };

    if (step === 'success') {
        return (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mb-4 animate-bounce">
                        ✅
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">Pagamento Aprovado!</h3>
                    <p className="text-slate-500 text-center">Seu valor está seguro no cofre do app.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="bg-[#009EE3] p-6 text-white flex justify-between items-start">
                    <div>
                        <span className="text-xs font-bold opacity-80 uppercase tracking-wider">Checkout</span>
                        <h3 className="text-2xl font-black mt-1">R$ {booking.price},00</h3>
                        <p className="text-sm opacity-90 mt-1">{booking.service} com {booking.proName}</p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white font-bold text-xl">✕</button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
                        <button 
                            onClick={() => setMethod('pix')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${method === 'pix' ? 'bg-white text-[#009EE3] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            💠 PIX
                        </button>
                        <button 
                            onClick={() => setMethod('card')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${method === 'card' ? 'bg-white text-[#009EE3] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            💳 Cartão
                        </button>
                    </div>

                    {method === 'pix' ? (
                        <div className="space-y-4 text-center">
                            <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-xl p-8 flex flex-col items-center justify-center">
                                <div className="w-48 h-48 bg-white p-2 shadow-sm rounded-lg mb-4">
                                    <div className="w-full h-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SimulacaoPagamentoValeConecta')] bg-cover"></div>
                                </div>
                                <p className="text-sm text-slate-500 font-medium">Escaneie o QR Code no app do seu banco</p>
                            </div>
                            
                            <div className="relative">
                                <input 
                                    readOnly 
                                    value="00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000" 
                                    className="w-full bg-slate-100 border border-slate-200 rounded-lg py-3 px-4 text-xs text-slate-500 font-mono"
                                />
                                <button className="absolute right-2 top-2 text-xs font-bold text-[#009EE3] bg-blue-50 px-2 py-1 rounded hover:bg-blue-100">Copiar</button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in slide-in-from-right fade-in duration-300">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Número do Cartão</label>
                                <input type="text" placeholder="0000 0000 0000 0000" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#009EE3]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Validade</label>
                                    <input type="text" placeholder="MM/AA" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#009EE3]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CVV</label>
                                    <input type="text" placeholder="123" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#009EE3]" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50">
                    <button 
                        onClick={handlePay}
                        disabled={loading}
                        className="w-full bg-[#009EE3] text-white py-4 rounded-xl font-bold hover:brightness-95 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processando...' : `🔒 Pagar R$ ${booking.price},00`}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Service Request Modal ---
interface ServiceRequestModalProps {
  onClose: () => void;
  onConfirm: (request: Omit<ServiceRequest, 'id' | 'clientId' | 'status' | 'createdAt' | 'unlockedBy'>) => void;
}

const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({ onClose, onConfirm }) => {
    const [formData, setFormData] = useState({
        category: '',
        city: '',
        description: '',
        urgency: 'medium' as 'low' | 'medium' | 'high',
        contactPhone: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(formData);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-800">Publicar Pedido</h3>
                        <p className="text-sm text-slate-500">Profissionais qualificados entrarão em contato.</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-300">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">O que você precisa?</label>
                        <select 
                            required
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.category}
                            onChange={e => setFormData({...formData, category: e.target.value})}
                        >
                            <option value="">Selecione uma categoria...</option>
                            {SERVICE_CONSTANTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cidade</label>
                        <select 
                            required
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.city}
                            onChange={e => setFormData({...formData, city: e.target.value})}
                        >
                            <option value="">Selecione a cidade...</option>
                            {CITY_CONSTANTS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Detalhes do Pedido</label>
                        <textarea 
                            required
                            placeholder="Descreva o serviço com detalhes..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-28 resize-none"
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Seu WhatsApp</label>
                        <input 
                            required
                            type="tel"
                            placeholder="(13) 99999-9999"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.contactPhone}
                            onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                        />
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Urgência</label>
                         <div className="flex gap-2">
                             {['low', 'medium', 'high'].map(u => (
                                 <button
                                    key={u}
                                    type="button"
                                    onClick={() => setFormData({...formData, urgency: u as any})}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${formData.urgency === u 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-white text-slate-500 border-slate-200'
                                    }`}
                                 >
                                     {u === 'low' ? 'Baixa' : u === 'medium' ? 'Média' : 'Alta'}
                                 </button>
                             ))}
                         </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg mt-2">
                        Publicar Pedido Agora
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- Plan Editor Modal ---
interface PlanEditorModalProps {
  plan?: Plan;
  onClose: () => void;
  onSave: (plan: Plan) => void;
}

const PlanEditorModal: React.FC<PlanEditorModalProps> = ({ plan, onClose, onSave }) => {
  const [formData, setFormData] = useState<Plan>({
    id: plan?.id || `plan_${Date.now()}`,
    name: plan?.name || '',
    price: plan?.price || 'R$ 0,00',
    period: plan?.period || "/mês",
    fee: plan?.fee || '',
    color: plan?.color || 'bg-slate-100 border-slate-200',
    buttonColor: plan?.buttonColor || 'bg-slate-800 text-white',
    features: plan?.features || [''],
    recommended: plan?.recommended || false
  });

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => setFormData({ ...formData, features: [...formData.features, ''] });
  const removeFeature = (index: number) => setFormData({ ...formData, features: formData.features.filter((_, i) => i !== index) });

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
          <h3 className="text-lg font-bold">{plan ? 'Editar Plano' : 'Novo Plano'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Nome do Plano</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Preço (Display)</label>
              <input type="text" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Ex: R$ 29,90" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Taxa/Fee Descrição</label>
              <input type="text" value={formData.fee} onChange={e => setFormData({...formData, fee: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div className="flex items-center pt-6">
               <input type="checkbox" id="recommended" checked={formData.recommended} onChange={e => setFormData({...formData, recommended: e.target.checked})} className="mr-2 w-5 h-5 accent-blue-600" />
               <label htmlFor="recommended" className="font-bold text-slate-700">Marcar como Recomendado</label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Estilo do Cartão</label>
            <select value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full p-2 border rounded-lg mb-2">
               <option value="bg-slate-100 border-slate-200">Cinza (Padrão)</option>
               <option value="bg-blue-50 border-blue-200">Azul (Plus)</option>
               <option value="bg-amber-50 border-amber-200">Amarelo/Ouro (Premium)</option>
            </select>
          </div>
          <div>
             <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Lista de Vantagens</label>
             <div className="space-y-2">
               {formData.features.map((feat, idx) => (
                 <div key={idx} className="flex gap-2">
                   <input type="text" value={feat} onChange={e => handleFeatureChange(idx, e.target.value)} className="flex-grow p-2 border rounded-lg text-sm" />
                   <button onClick={() => removeFeature(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded">🗑️</button>
                 </div>
               ))}
               <button onClick={addFeature} className="text-blue-600 text-sm font-bold hover:underline">+ Adicionar Vantagem</button>
             </div>
          </div>
        </div>
        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg">Cancelar</button>
          <button onClick={() => onSave(formData)} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md">Salvar Plano</button>
        </div>
      </div>
    </div>
  );
};

// --- Profile Editor Modal ---
interface ProfileEditorModalProps {
  pro: Professional;
  onClose: () => void;
  onSave: (updatedPro: Professional) => void;
}

const ProfileEditorModal: React.FC<ProfileEditorModalProps> = ({ pro, onClose, onSave }) => {
  const [formData, setFormData] = useState<Professional>({ ...pro });

  const handleServiceToggle = (service: string) => {
    const services = formData.services.includes(service)
      ? formData.services.filter(s => s !== service)
      : [...formData.services, service];
    setFormData({ ...formData, services });
  };

  const handleCityToggle = (city: string) => {
    const cities = formData.cities.includes(city)
      ? formData.cities.filter(c => c !== city)
      : [...formData.cities, city];
    setFormData({ ...formData, cities });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800">Editar Perfil</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">✕</button>
        </div>
        
        <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Nome Completo</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Foto (URL)</label>
                    <input type="text" value={formData.photo} onChange={e => setFormData({...formData, photo: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Sobre Você</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none" />
            </div>

            {/* Business Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Preço Base (Visita)</label>
                    <input type="number" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Chave PIX</label>
                    <input type="text" value={formData.pixKey || ''} onChange={e => setFormData({...formData, pixKey: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="CPF, Email ou Aleatória" />
                </div>
            </div>

            {/* Services */}
            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Especialidades</label>
                <div className="flex flex-wrap gap-2">
                    {SERVICE_CONSTANTS.map(s => (
                        <button 
                            key={s}
                            onClick={() => handleServiceToggle(s)}
                            className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                                formData.services.includes(s) 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

             {/* Cities */}
             <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Cidades de Atuação</label>
                <div className="flex flex-wrap gap-2">
                    {CITY_CONSTANTS.map(c => (
                        <button 
                            key={c}
                            onClick={() => handleCityToggle(c)}
                            className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                                formData.cities.includes(c) 
                                ? 'bg-green-600 text-white border-green-600' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-green-300'
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

        </div>

        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
          <button onClick={() => onSave(formData)} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors">Salvar Alterações</button>
        </div>
      </div>
    </div>
  );
};

// --- HELPER ---
const getReputationInfo = (p: Professional) => {
    if (p.reviewCount >= 100 && p.rating >= 4.9) return { level: 'Diamante', color: 'bg-cyan-500', icon: '💎' };
    if (p.reviewCount >= 50 && p.rating >= 4.8) return { level: 'Ouro', color: 'bg-yellow-400', icon: '🏆' };
    if (p.reviewCount >= 30 && p.rating >= 4.5) return { level: 'Prata', color: 'bg-slate-400', icon: '🥈' };
    if (p.reviewCount >= 10 && p.rating >= 4.0) return { level: 'Bronze', color: 'bg-amber-700', icon: '🥉' };
    return { level: 'Novato', color: 'bg-slate-500', icon: '🛡️' };
};

// --- VIEWS ---

const ProfessionalsListView: React.FC<{
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    onViewProfile: (pro: Professional) => void;
}> = ({ addToast, onViewProfile }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    const filteredPros = useMemo(() => {
        return MOCK_PROS.filter(p => {
            const matchText = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.services.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchCity = selectedCities.length === 0 || p.cities.some(c => selectedCities.includes(c));
            const matchService = selectedServices.length === 0 || p.services.some(s => selectedServices.includes(s));
            return matchText && matchCity && matchService;
        });
    }, [searchTerm, selectedCities, selectedServices]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
            <h1 className="text-3xl font-black text-slate-800 mb-8">Todos os Profissionais</h1>
            <div className="flex flex-col lg:flex-row gap-8">
                <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden w-full mb-2 bg-white p-4 rounded-2xl border border-slate-200 font-bold text-slate-700 shadow-sm flex justify-between items-center">
                    <span>⚙️ Filtros</span>
                </button>
                <aside className={`w-full lg:w-72 shrink-0 space-y-8 transition-all duration-300 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                        <h3 className="font-bold text-lg text-slate-800">Filtros</h3>
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Categorias</h4>
                            {SERVICE_CONSTANTS.map(service => (
                                <label key={service} className="flex items-center gap-2 cursor-pointer group mb-2">
                                    <input type="checkbox" className="w-4 h-4 accent-blue-600 rounded" checked={selectedServices.includes(service)} onChange={() => {
                                        if (selectedServices.includes(service)) setSelectedServices(selectedServices.filter(s => s !== service));
                                        else setSelectedServices([...selectedServices, service]);
                                    }}/>
                                    <span className="text-sm text-slate-600">{service}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </aside>
                <div className="flex-grow">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6">
                        <input type="text" placeholder="Buscar por nome ou serviço..." className="w-full h-10 px-4 rounded-lg bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredPros.map((pro, index) => <ProCard key={pro.id} pro={pro} rank={index + 1} onSelect={() => onViewProfile(pro)} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ServiceRequestsListView: React.FC<{
    requests: ServiceRequest[],
    onViewRequest: (req: ServiceRequest) => void,
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void
}> = ({ requests, onViewRequest }) => {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
            <h1 className="text-3xl font-black text-slate-800 mb-8">Mural de Pedidos</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {requests.map(req => (
                    <div key={req.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold uppercase">{req.category}</span>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${req.urgency === 'high' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                Urgência {req.urgency}
                            </span>
                        </div>
                        <p className="text-slate-800 font-medium mb-4">{req.description}</p>
                        <button onClick={() => onViewRequest(req)} className="w-full py-3 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors">Ver Detalhes</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- NEW COMPONENT: ServiceRequestDetailsView ---
const ServiceRequestDetailsView: React.FC<{
    request: ServiceRequest;
    onBack: () => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    userRole: UserRole;
    currentPro: Professional | null;
    onUnlockContact: (reqId: string, cost: number) => void;
}> = ({ request, onBack, addToast, userRole, currentPro, onUnlockContact }) => {
    const [showProposalModal, setShowProposalModal] = useState(false);
    const UNLOCK_COST = 50;

    const isUnlocked = userRole === 'pro' && currentPro && request.unlockedBy.includes(currentPro.id);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-300">
             <button onClick={onBack} className="group mb-6 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors">
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar para lista
             </button>

             <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">{request.category}</span>
                             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${request.urgency === 'high' ? 'bg-red-100 text-red-600' : request.urgency === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                Urgência {request.urgency === 'high' ? 'Alta' : request.urgency === 'medium' ? 'Média' : 'Baixa'}
                             </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800">Pedido #{request.id.slice(-4)}</h1>
                        <p className="text-slate-500 font-medium flex items-center gap-1 mt-1">
                           📍 {request.city} • <span className="text-xs">Postado em {new Date(request.createdAt).toLocaleDateString()}</span>
                        </p>
                    </div>
                    <button 
                        onClick={() => setShowProposalModal(true)}
                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        Enviar Proposta
                    </button>
                </div>

                {userRole === 'pro' && currentPro && (
                    <div className="mb-6">
                        {isUnlocked ? (
                            <div className="bg-green-50 border border-green-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-green-800 uppercase mb-1">Contato do Cliente</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-black text-slate-800">{request.contactPhone || '(13) 99999-9999'}</span>
                                        <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded font-bold">Desbloqueado</span>
                                    </div>
                                    <p className="text-sm text-green-700 mt-1">Você já pode entrar em contato diretamente.</p>
                                </div>
                                <a 
                                    href={`https://wa.me/55${request.contactPhone?.replace(/\D/g,'') || ''}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="bg-[#25D366] text-white px-6 py-3 rounded-xl font-bold hover:brightness-105 transition-all shadow-lg flex items-center gap-2"
                                >
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                    Conversar no WhatsApp
                                </a>
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-1">Contato do Cliente</h3>
                                    <p className="text-slate-600 mb-2">Desbloqueie para ver o telefone e WhatsApp.</p>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                        <span>💰 Custo: {UNLOCK_COST} créditos</span>
                                        <span>•</span>
                                        <span>Seu saldo: {currentPro.credits} créditos</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onUnlockContact(request.id, UNLOCK_COST)}
                                    disabled={currentPro.credits < UNLOCK_COST}
                                    className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Desbloquear Contato
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <hr className="border-slate-100 my-6" />

                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Descrição do Serviço</h3>
                        <p className="text-slate-800 text-lg leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            {request.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-1">Status</h3>
                            <p className="font-bold text-slate-700 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${request.status === 'open' ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                                {request.status === 'open' ? 'Aberto para propostas' : 'Fechado'}
                            </p>
                        </div>
                         <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-1">Interessados</h3>
                            <p className="font-bold text-slate-700">{request.unlockedBy.length} profissionais visualizaram</p>
                        </div>
                    </div>
                </div>
             </div>

             {showProposalModal && (
                <ProposalModal 
                    request={request} 
                    onClose={() => setShowProposalModal(false)} 
                    onConfirm={(details) => {
                        setShowProposalModal(false);
                        addToast("Proposta enviada com sucesso!", "success");
                    }} 
                />
             )}
        </div>
    );
};

const ProfessionalProfileView: React.FC<{
    pro: Professional;
    onBack: () => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}> = ({ pro, onBack, addToast }) => {
    const [showBooking, setShowBooking] = useState(false);

    // Helper to render stars
    const renderStars = (rating: number) => {
        return "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating));
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in duration-300">
             <button onClick={onBack} className="group mb-6 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors">
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar para lista
             </button>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Sidebar: Profile Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden sticky top-24">
                        <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400 relative">
                             {pro.verified && (
                                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1">
                                    ✓ Verificado
                                </div>
                             )}
                        </div>
                        <div className="px-6 relative">
                            <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden absolute -top-12 bg-white">
                                <img src={pro.photo} alt={pro.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="pt-16 pb-6 text-center lg:text-left">
                                <h1 className="text-2xl font-black text-slate-800 leading-tight mb-1">{pro.name}</h1>
                                <div className="flex items-center justify-center lg:justify-start gap-2 text-slate-600 text-sm mb-4">
                                     <span className="text-amber-500 text-lg">★</span>
                                     <span className="font-bold">{pro.rating}</span>
                                     <span className="text-slate-400">({pro.reviewCount} avaliações)</span>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-6">
                                    {pro.services.map(s => (
                                        <span key={s} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase">{s}</span>
                                    ))}
                                </div>

                                <div className="border-t border-slate-100 pt-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-slate-500 text-sm font-medium">Valor base</span>
                                        <span className="text-2xl font-black text-slate-800">R$ {pro.basePrice}</span>
                                    </div>
                                    <button 
                                        onClick={() => setShowBooking(true)} 
                                        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                                    >
                                        Agendar Serviço
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content: Description & Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* About Section */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Sobre o Profissional</h2>
                        <p className="text-slate-600 leading-relaxed text-lg">{pro.description}</p>
                        
                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Cidades Atendidas</h4>
                                <p className="font-semibold text-slate-800">{pro.cities.join(', ')}</p>
                            </div>
                             <div className="bg-slate-50 p-4 rounded-xl">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Membro desde</h4>
                                <p className="font-semibold text-slate-800">Janeiro, 2023</p>
                            </div>
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center justify-between">
                            Avaliações de Clientes
                            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                                {pro.reviewCount} total
                            </span>
                        </h2>
                        
                        <div className="space-y-6">
                            {pro.reviews && pro.reviews.length > 0 ? (
                                pro.reviews.map((review: any) => (
                                    <div key={review.id} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">
                                                    {review.author.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800">{review.author}</h4>
                                                    <div className="text-amber-400 text-sm tracking-widest">
                                                        {renderStars(review.rating)}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-400 font-medium">{review.date}</span>
                                        </div>
                                        <p className="text-slate-600 pl-14">{review.comment}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 italic">Nenhuma avaliação detalhada disponível.</p>
                            )}
                        </div>
                    </div>
                </div>
             </div>

             {showBooking && <BookingModal pro={pro} onClose={() => setShowBooking(false)} onConfirm={() => { setShowBooking(false); addToast("Solicitação enviada!", "success"); }} />}
        </div>
    );
};

const ClientHomeView: React.FC<{ 
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void, 
    onNavigate: (view: string) => void, 
    plans: Plan[], 
    onViewProfile: (pro: Professional) => void,
    onRequestService: (req: any) => void 
}> = ({ onNavigate, plans, onViewProfile, onRequestService }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const highlightedPros = MOCK_PROS.slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
       <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">Encontre profissionais de confiança <br/> <span className="text-blue-600">no Vale do Ribeira</span></h1>
          <div className="bg-white p-4 rounded-3xl shadow-xl max-w-3xl mx-auto flex flex-col md:flex-row gap-4 border border-slate-100 mt-8">
             <div className="flex-grow"><input type="text" placeholder="O que você precisa?" className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
             <button onClick={() => onNavigate('professionals')} className="h-12 px-8 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">🔍 Buscar</button>
          </div>
          <div className="mt-6">
              <span className="text-slate-500 text-sm">Não quer procurar? </span>
              <button onClick={() => setIsRequestModalOpen(true)} className="text-blue-600 font-bold hover:underline">Publique um pedido</button>
          </div>
       </div>

       <div className="mb-16">
          <h2 className="text-2xl font-black text-slate-800 mb-6">Profissionais em Destaque</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {highlightedPros.map((pro, index) => <ProCard key={pro.id} pro={pro} rank={index + 1} onSelect={() => onViewProfile(pro)} />)}
          </div>
       </div>

       <section className="bg-slate-900 rounded-3xl p-8 md:p-16 text-white relative overflow-hidden mb-16">
          <div className="relative z-10 text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-6">Profissionalize seu serviço</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {plans.map(plan => (
               <div key={plan.id} className={`p-8 rounded-3xl flex flex-col relative ${plan.recommended ? 'bg-blue-600 text-white scale-105 shadow-2xl' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                   <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                   <span className="text-4xl font-black mb-6">{plan.price}</span>
                   <ul className="space-y-4 mb-8 flex-grow">
                       {plan.features.map((feat, i) => <li key={i} className="flex items-start gap-3 text-sm"><span>✓</span><span>{feat}</span></li>)}
                   </ul>
                   <button onClick={() => onNavigate('register')} className="w-full py-4 rounded-xl font-bold bg-white/10 hover:bg-white/20">Começar Agora</button>
               </div>
            ))}
          </div>
       </section>

       {isRequestModalOpen && <ServiceRequestModal onClose={() => setIsRequestModalOpen(false)} onConfirm={(req) => { onRequestService(req); setIsRequestModalOpen(false); }} />}
    </div>
  );
};

const ClientDashboardView: React.FC<{
    bookings: Booking[];
    requests: ServiceRequest[];
    onRequestService: (req: any) => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    onUpdateBookingStatus: (id: string, status: any) => void;
}> = ({ bookings, requests, onRequestService, addToast, onUpdateBookingStatus }) => {
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-black text-slate-800 mb-8">Minha Área</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold mb-4">Meus Pedidos</h2>
                    <div className="space-y-4">
                        {requests.map(req => (
                            <div key={req.id} className="p-4 border rounded-xl">
                                <div className="font-bold">{req.category}</div>
                                <div className="text-sm text-slate-500">{req.description}</div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setIsRequestModalOpen(true)} className="mt-4 text-blue-600 font-bold hover:underline">+ Novo Pedido</button>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold mb-4">Agendamentos</h2>
                    <div className="space-y-4">
                        {bookings.map(book => (
                            <div key={book.id} className="p-4 border rounded-xl flex flex-col gap-3">
                                <div className="flex justify-between">
                                    <div><div className="font-bold">{book.service}</div><div className="text-sm text-slate-500">com {book.proName}</div></div>
                                    <div className="text-right"><div className="font-bold">R$ {book.price}</div><span className="text-xs font-bold uppercase">{book.status}</span></div>
                                </div>
                                {book.status === 'accepted' && <button onClick={() => setPaymentBooking(book)} className="w-full py-2 bg-green-600 text-white rounded-lg font-bold">💳 Pagar Agora</button>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {isRequestModalOpen && <ServiceRequestModal onClose={() => setIsRequestModalOpen(false)} onConfirm={(req) => { onRequestService(req); setIsRequestModalOpen(false); }} />}
            {paymentBooking && <PaymentModal booking={paymentBooking} onClose={() => setPaymentBooking(null)} onSuccess={() => { onUpdateBookingStatus(paymentBooking.id, 'paid'); setPaymentBooking(null); addToast("Pagamento realizado!", "success"); }} />}
        </div>
    );
};

const ProDashboardView: React.FC<{
    pro: Professional;
    requests: ServiceRequest[];
    bookings: Booking[];
    onUnlockContact: (reqId: string, cost: number) => void;
    onUpdateBookingStatus: (id: string, status: any) => void;
    onAddCredits: () => void;
    onEditProfile: (updatedPro: Professional) => void;
}> = ({ pro, requests, bookings, onUnlockContact, onUpdateBookingStatus, onAddCredits, onEditProfile }) => {
    const UNLOCK_COST = 50;
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg relative group">
                        <img src={pro.photo} alt={pro.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                             <h1 className="text-3xl font-black text-slate-800">{pro.name}</h1>
                             <button onClick={() => setIsEditModalOpen(true)} className="text-slate-400 hover:text-blue-600 transition-colors" title="Editar Perfil">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                 </svg>
                             </button>
                        </div>
                        <p className="text-slate-500">Vamos encontrar novos clientes hoje?</p>
                    </div>
                </div>
                <div className="flex gap-3">
                     <div className="bg-slate-800 text-white px-6 py-3 rounded-xl shadow-lg flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase opacity-70">Créditos</span>
                        <span className="text-xl font-black text-amber-400">{pro.credits}</span>
                    </div>
                     <button onClick={onAddCredits} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-200 transition-colors">
                        + Recarregar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Opportunities */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            🚀 Oportunidades no Vale
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{requests.length} novas</span>
                        </h2>
                        <div className="space-y-4">
                            {requests.map(req => {
                                const isUnlocked = req.unlockedBy.includes(pro.id);
                                return (
                                    <div key={req.id} className="p-5 rounded-xl border border-slate-200 hover:border-blue-300 transition-all bg-slate-50/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold uppercase">{req.category}</span>
                                            <span className="text-xs font-bold text-slate-400">{req.city}</span>
                                        </div>
                                        <p className="text-slate-800 font-medium mb-4 line-clamp-2">{req.description}</p>
                                        
                                        {isUnlocked ? (
                                            <div className="bg-green-100 border border-green-200 p-3 rounded-lg flex justify-between items-center">
                                                <div>
                                                    <span className="block text-xs font-bold text-green-700 uppercase">Contato do Cliente</span>
                                                    <span className="font-black text-green-800 text-lg">{req.contactPhone || '(13) 99999-9999'}</span>
                                                </div>
                                                <a href={`https://wa.me/55${req.contactPhone?.replace(/\D/g,'') || ''}`} target="_blank" rel="noreferrer" className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700">
                                                    Chamar no WhatsApp
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200/60">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${req.urgency === 'high' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                        Urgência {req.urgency === 'high' ? 'Alta' : req.urgency === 'medium' ? 'Média' : 'Baixa'}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={() => onUnlockContact(req.id, UNLOCK_COST)}
                                                    disabled={pro.credits < UNLOCK_COST}
                                                    className="bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-colors text-sm"
                                                >
                                                    Desbloquear por {UNLOCK_COST} créditos
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column: Schedule & Financial */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                         <h2 className="text-lg font-bold mb-4">Minha Agenda</h2>
                         <div className="space-y-3">
                             {bookings.filter(b => b.proId === pro.id).length === 0 ? (
                                 <p className="text-slate-400 text-center py-4 text-sm">Nenhum serviço agendado.</p>
                             ) : (
                                 bookings.filter(b => b.proId === pro.id).map(booking => (
                                     <div key={booking.id} className="p-3 border rounded-lg bg-white relative">
                                         <div className="flex justify-between mb-1">
                                             <span className="font-bold text-sm text-slate-800">{booking.date}</span>
                                             <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                                 booking.status === 'accepted' ? 'bg-green-100 text-green-700' : 
                                                 booking.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                                                 'bg-slate-100 text-slate-600'
                                             }`}>{booking.status === 'accepted' ? 'Confirmado' : booking.status}</span>
                                         </div>
                                         <p className="text-xs text-slate-500 mb-2">{booking.service} para {booking.clientName}</p>
                                         {booking.status === 'pending' && (
                                             <div className="flex gap-2">
                                                 <button onClick={() => onUpdateBookingStatus(booking.id, 'accepted')} className="flex-1 bg-green-500 text-white py-1 rounded text-xs font-bold">Aceitar</button>
                                                 <button onClick={() => onUpdateBookingStatus(booking.id, 'rejected')} className="flex-1 bg-red-100 text-red-600 py-1 rounded text-xs font-bold">Recusar</button>
                                             </div>
                                         )}
                                     </div>
                                 ))
                             )}
                         </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xs font-bold uppercase opacity-60 mb-1">Ganhos do Mês</h3>
                        <div className="text-3xl font-black mb-4">R$ 1.850,00</div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-green-400 w-[70%]"></div>
                        </div>
                        <p className="text-xs text-slate-400">Meta: R$ 2.500,00</p>
                    </div>
                </div>
            </div>
            
            {isEditModalOpen && (
                <ProfileEditorModal 
                    pro={pro} 
                    onClose={() => setIsEditModalOpen(false)} 
                    onSave={(updated) => {
                        onEditProfile(updated);
                        setIsEditModalOpen(false);
                    }} 
                />
            )}
        </div>
    );
};

const AdminDashboardView: React.FC<{
    plans: Plan[];
    onUpdatePlans: (plans: Plan[]) => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}> = ({ plans, onUpdatePlans, addToast }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'financial' | 'plans' | 'verification'>('overview');
    const [editingPlan, setEditingPlan] = useState<Plan | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mock Users Data for Admin
    const [users, setUsers] = useState([
        ...MOCK_PROS.map(p => ({ ...p, role: 'pro', joinDate: '2024-01-15' })),
        { id: 'c1', name: 'Maria Souza', role: 'client', joinDate: '2024-02-10', verified: true, verificationStatus: 'verified', email: 'maria@example.com' },
        { id: 'c2', name: 'João Paulo', role: 'client', joinDate: '2024-03-05', verified: true, verificationStatus: 'verified', email: 'joao@example.com' }
    ]);

    // Mock Verification Queue
    const [pendingVerifications, setPendingVerifications] = useState([
        { id: 'v1', proId: '3', name: 'José Pinturas', docType: 'RG/CNH', docUrl: 'https://picsum.photos/seed/doc1/400/300', status: 'pending', date: '2024-05-20' },
        { id: 'v2', proId: '5', name: 'Antônio Jardineiro', docType: 'Comprovante Residência', docUrl: 'https://picsum.photos/seed/doc2/400/300', status: 'pending', date: '2024-05-21' }
    ]);

    // Mock Financial Transactions
    const transactions = [
        { id: 't1', type: 'Assinatura Premium', user: 'Carlos Oliveira', amount: 59.90, date: '2024-05-01', status: 'completed' },
        { id: 't2', type: 'Taxa Serviço (10%)', user: 'Ana Maria', amount: 20.00, date: '2024-05-02', status: 'completed' },
        { id: 't3', type: 'Assinatura Plus', user: 'Marcos Hidráulica', amount: 29.90, date: '2024-05-03', status: 'completed' },
        { id: 't4', type: 'Taxa Desbloqueio', user: 'Carlos Oliveira', amount: 5.00, date: '2024-05-04', status: 'completed' },
    ];

    // Mock Chart Data
    const revenueData = [
        { name: 'Jan', value: 1200 },
        { name: 'Fev', value: 1900 },
        { name: 'Mar', value: 2400 },
        { name: 'Abr', value: 2100 },
        { name: 'Mai', value: 3200 },
    ];

    const handleSavePlan = (plan: Plan) => {
        const exists = plans.find(p => p.id === plan.id);
        if (exists) {
            onUpdatePlans(plans.map(p => p.id === plan.id ? plan : p));
            addToast("Plano atualizado!", "success");
        } else {
            onUpdatePlans([...plans, plan]);
            addToast("Plano criado!", "success");
        }
        setIsModalOpen(false);
    };

    const handleDeletePlan = (id: string) => {
        if (window.confirm("Excluir plano?")) {
            onUpdatePlans(plans.filter(p => p.id !== id));
            addToast("Plano removido.", "info");
        }
    };

    const toggleUserStatus = (id: string, field: 'verified' | 'blocked') => {
        setUsers(users.map(u => {
            if (u.id === id) {
                if (field === 'verified') return { ...u, verified: !u.verified, verificationStatus: !u.verified ? 'verified' : 'unverified' };
                // Logic for blocking would go here
            }
            return u;
        }));
        addToast("Status do usuário atualizado", "info");
    };

    const handleVerify = (id: string, approved: boolean) => {
        setPendingVerifications(pendingVerifications.filter(v => v.id !== id));
        addToast(approved ? "Documento aprovado e profissional verificado." : "Documento rejeitado.", approved ? "success" : "info");
    };

    const renderOverview = () => (
        <div className="space-y-6 animate-in fade-in">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Receita Mensal</h3>
                    <p className="text-3xl font-black text-green-600">R$ 3.200,00</p>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-bold">+15% vs mês anterior</span>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Usuários Ativos</h3>
                    <p className="text-3xl font-black text-slate-800">{users.length}</p>
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-bold">4 Novos hoje</span>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Assinaturas Ativas</h3>
                    <p className="text-3xl font-black text-slate-800">85</p>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
                <h3 className="font-bold text-lg mb-4">Evolução da Receita</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#2563eb" fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    const renderUsers = () => (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg">Base de Usuários</h3>
                <input type="text" placeholder="Buscar usuário..." className="bg-slate-50 border-none rounded-lg px-4 py-2 text-sm w-64" />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                        <tr>
                            <th className="p-4">Nome</th>
                            <th className="p-4">Tipo</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Data Cadastro</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((u: any) => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-bold text-slate-700">{u.name}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${u.role === 'pro' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {u.role === 'pro' ? 'Profissional' : 'Cliente'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {u.verified ? (
                                        <span className="text-green-600 font-bold flex items-center gap-1">✓ Verificado</span>
                                    ) : (
                                        <span className="text-slate-400 font-bold">Pendente</span>
                                    )}
                                </td>
                                <td className="p-4 text-slate-500">{u.joinDate}</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => toggleUserStatus(u.id, 'verified')} className="text-blue-600 font-bold hover:underline text-xs mr-3">
                                        {u.verified ? 'Remover Selo' : 'Aprovar'}
                                    </button>
                                    <button className="text-red-600 font-bold hover:underline text-xs">Banir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderFinancial = () => (
         <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
            <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-lg">Histórico de Transações</h3>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                    <tr>
                        <th className="p-4">Data</th>
                        <th className="p-4">Descrição</th>
                        <th className="p-4">Usuário</th>
                        <th className="p-4">Valor</th>
                        <th className="p-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {transactions.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-slate-500">{t.date}</td>
                            <td className="p-4 font-bold text-slate-700">{t.type}</td>
                            <td className="p-4">{t.user}</td>
                            <td className="p-4 font-mono font-bold text-green-600">+ R$ {t.amount.toFixed(2)}</td>
                            <td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">Pago</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderPlans = () => (
        <div className="animate-in fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Gerenciar Planos</h2>
                    <button onClick={() => { setEditingPlan(undefined); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">+ Novo Plano</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <div key={plan.id} className="p-6 rounded-xl border-2 border-slate-200 relative group bg-white hover:border-blue-300 transition-colors">
                            <h3 className="font-bold text-lg">{plan.name}</h3>
                            <div className="text-2xl font-black mt-2">R$ {plan.price}</div>
                            <div className="text-xs text-slate-500 mb-4">{plan.period}</div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={() => { setEditingPlan(plan); setIsModalOpen(true); }} className="text-blue-600 text-sm font-bold hover:underline">Editar</button>
                                <button onClick={() => handleDeletePlan(plan.id)} className="text-red-600 text-sm font-bold hover:underline">Excluir</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderVerification = () => (
        <div className="space-y-6 animate-in fade-in">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Pendentes</h3>
                    <p className="text-3xl font-black text-amber-500">{pendingVerifications.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Aprovados Hoje</h3>
                    <p className="text-3xl font-black text-green-600">12</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Tempo Médio</h3>
                    <p className="text-3xl font-black text-slate-800">4h</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-lg">Fila de Análise de Documentos</h3>
                </div>
                {pendingVerifications.length === 0 ? (
                    <div className="p-10 text-center text-slate-500">
                        <p>Nenhum documento pendente para análise. 🎉</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {pendingVerifications.map(item => (
                            <div key={item.id} className="p-6 flex flex-col md:flex-row gap-6">
                                <div className="w-full md:w-48 h-32 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                                    <img src={item.docUrl} alt="Documento" className="w-full h-full object-cover hover:scale-110 transition-transform cursor-zoom-in" />
                                </div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-lg text-slate-800">{item.name}</h4>
                                            <span className="text-xs font-bold text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded">{item.docType}</span>
                                        </div>
                                        <span className="text-xs text-slate-400 font-medium">{item.date}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-4">
                                        Solicitação de verificação de identidade. Verifique se a foto corresponde ao perfil e se os dados estão legíveis.
                                    </p>
                                    <div className="flex gap-3">
                                        <button onClick={() => handleVerify(item.id, true)} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm">
                                            ✓ Aprovar Documento
                                        </button>
                                        <button onClick={() => handleVerify(item.id, false)} className="px-4 py-2 bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200 transition-colors text-sm">
                                            ✕ Rejeitar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 min-h-screen">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 shrink-0">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sticky top-24">
                    <h2 className="text-xs font-bold text-slate-400 uppercase mb-4 px-4">Menu Admin</h2>
                    <nav className="space-y-1">
                        <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                            📊 Visão Geral
                        </button>
                        <button onClick={() => setActiveTab('users')} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                            👥 Usuários
                        </button>
                        <button onClick={() => setActiveTab('financial')} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'financial' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                            💰 Financeiro
                        </button>
                        <button onClick={() => setActiveTab('plans')} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'plans' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                            💎 Planos
                        </button>
                        <button onClick={() => setActiveTab('verification')} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'verification' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                            📑 Verificação
                        </button>
                    </nav>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-grow">
                <header className="mb-8">
                    <h1 className="text-3xl font-black text-slate-800">
                        {activeTab === 'overview' && 'Dashboard'}
                        {activeTab === 'users' && 'Gestão de Usuários'}
                        {activeTab === 'financial' && 'Controle Financeiro'}
                        {activeTab === 'plans' && 'Planos de Assinatura'}
                        {activeTab === 'verification' && 'Verificação de Documentos'}
                    </h1>
                </header>
                
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'financial' && renderFinancial()}
                {activeTab === 'plans' && renderPlans()}
                {activeTab === 'verification' && renderVerification()}
            </main>

            {isModalOpen && <PlanEditorModal plan={editingPlan} onClose={() => setIsModalOpen(false)} onSave={handleSavePlan} />}
        </div>
    );
};

const App: React.FC = () => {
    const [userRole, setUserRole] = useState<UserRole>('guest');
    const [view, setView] = useState('home');
    const [toasts, setToasts] = useState<{id: number, message: string, type: 'success' | 'error' | 'info'}[]>([]);
    const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    const [currentPro, setCurrentPro] = useState<Professional | null>(null); // State for logged-in professional
    const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
    const [requests, setRequests] = useState<ServiceRequest[]>(INITIAL_REQUESTS);
    const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);

    const addToast = (message: string, type: 'success' | 'error' | 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

    const handleLogin = (role: UserRole) => {
        setUserRole(role);
        
        if (role === 'pro') {
            setCurrentPro(MOCK_PROS[0]); // Demo: Log in as first mock pro
            setView('pro-dashboard');
        } else if (role === 'admin') {
            setView('admin-dashboard');
        } else {
            setView('client-dashboard');
        }

        addToast(`Bem-vindo, ${role === 'admin' ? 'Admin' : role === 'pro' ? 'Profissional' : 'Cliente'}!`, 'success');
    };

    const handleLogout = () => {
        setUserRole('guest');
        setCurrentPro(null);
        setView('home');
        addToast('Você saiu do sistema.', 'info');
    };

    const handleNavigate = (target: string) => {
        setView(target);
        window.scrollTo(0,0);
    };

    const handleViewProfile = (pro: Professional) => {
        setSelectedPro(pro);
        setView('profile');
        window.scrollTo(0,0);
    };

    const handleViewRequest = (req: ServiceRequest) => {
        setSelectedRequest(req);
        setView('request-details');
        window.scrollTo(0,0);
    };

    const handleRequestService = (reqData: any) => {
        const newReq: ServiceRequest = {
            id: `r${Date.now()}`,
            clientId: 'me',
            status: 'open',
            createdAt: new Date().toISOString(),
            unlockedBy: [],
            ...reqData
        };
        setRequests([newReq, ...requests]);
        addToast('Pedido publicado com sucesso!', 'success');
    };

    const handleUpdateBookingStatus = (id: string, status: any) => {
        setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
    };
    
    // Pro Features
    const handleUnlockContact = (reqId: string, cost: number) => {
        if (!currentPro) return;
        if (currentPro.credits < cost) {
            addToast("Saldo insuficiente de créditos.", "error");
            return;
        }
        
        // Deduct credits locally
        setCurrentPro({ ...currentPro, credits: currentPro.credits - cost });
        
        // Unlock request
        setRequests(requests.map(r => 
            r.id === reqId ? { ...r, unlockedBy: [...r.unlockedBy, currentPro.id] } : r
        ));
        
        addToast("Contato desbloqueado com sucesso!", "success");
    };

    const handleAddCredits = () => {
        if (!currentPro) return;
        setCurrentPro({ ...currentPro, credits: currentPro.credits + 100 });
        addToast("100 Créditos adicionados (Demo)", "success");
    };

    const handleUpdateProfile = (updatedPro: Professional) => {
        setCurrentPro(updatedPro);
        addToast("Perfil atualizado com sucesso!", "success");
    };

    const renderView = () => {
        switch(view) {
            case 'home': return <ClientHomeView addToast={addToast} onNavigate={handleNavigate} plans={plans} onViewProfile={handleViewProfile} onRequestService={handleRequestService} />;
            case 'professionals': return <ProfessionalsListView addToast={addToast} onViewProfile={handleViewProfile} />;
            case 'profile': return selectedPro ? <ProfessionalProfileView pro={selectedPro} onBack={() => setView('professionals')} addToast={addToast} /> : <ProfessionalsListView addToast={addToast} onViewProfile={handleViewProfile} />;
            case 'requests-list': return <ServiceRequestsListView requests={requests} onViewRequest={handleViewRequest} addToast={addToast} />;
            case 'request-details': return selectedRequest ? (
                <ServiceRequestDetailsView 
                    request={selectedRequest} 
                    onBack={() => setView('requests-list')} 
                    addToast={addToast}
                    userRole={userRole}
                    currentPro={currentPro}
                    onUnlockContact={handleUnlockContact}
                />
            ) : (
                <ServiceRequestsListView requests={requests} onViewRequest={handleViewRequest} addToast={addToast} />
            );
            case 'client-dashboard': return <ClientDashboardView bookings={bookings} requests={requests} onRequestService={handleRequestService} addToast={addToast} onUpdateBookingStatus={handleUpdateBookingStatus} />;
            case 'admin-dashboard': return <AdminDashboardView plans={plans} onUpdatePlans={setPlans} addToast={addToast} />;
            case 'pro-dashboard': return currentPro ? (
                <ProDashboardView 
                    pro={currentPro} 
                    requests={requests} 
                    bookings={bookings} 
                    onUnlockContact={handleUnlockContact} 
                    onUpdateBookingStatus={handleUpdateBookingStatus} 
                    onAddCredits={handleAddCredits}
                    onEditProfile={handleUpdateProfile}
                />
            ) : (
                <div className="p-10 text-center">Erro: Nenhum profissional logado.</div>
            );
            case 'login': return (
                <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-lg text-center border border-slate-100">
                    <h2 className="text-2xl font-bold mb-6 text-slate-800">Login de Acesso</h2>
                    <div className="space-y-4">
                        <button onClick={() => handleLogin('client')} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">Entrar como Cliente</button>
                        <button onClick={() => handleLogin('pro')} className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors">Entrar como Profissional</button>
                        <button onClick={() => handleLogin('admin')} className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors">Entrar como Admin</button>
                    </div>
                </div>
            );
            case 'register': return (
                <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-lg text-center border border-slate-100">
                     <h2 className="text-2xl font-bold mb-4 text-slate-800">Criar Conta</h2>
                     <button onClick={() => handleLogin('client')} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl mb-4 hover:bg-green-700 transition-colors">Criar Conta Grátis</button>
                     <button onClick={() => setView('home')} className="text-slate-500 font-bold hover:underline">Voltar</button>
                </div>
            );
            default: return <ClientHomeView addToast={addToast} onNavigate={handleNavigate} plans={plans} onViewProfile={handleViewProfile} onRequestService={handleRequestService} />;
        }
    };

    return (
        <Layout userRole={userRole} onLogout={handleLogout} onNavigate={handleNavigate}>
            {renderView()}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </Layout>
    );
};

export default App;