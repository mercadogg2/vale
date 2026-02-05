import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { ProCard } from './components/ProCard';
import { UserRole, Professional, Booking, VerificationStatus, ReputationLevel, SubscriptionPlan, Plan, ServiceRequest } from './types';
import { MOCK_PROS, SERVICES as SERVICE_CONSTANTS, CITIES as CITY_CONSTANTS } from './constants';
import { getSmartServiceEstimate } from './services/geminiService';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

// --- MOCK INITIAL DATA FOR REQUESTS ---
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

              {/* Mensagem de Garantia/Trust (Anti-Leakage) */}
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

// --- Proposal Modal (Pro sends to Client) ---
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
                {/* Header Mercado Pago Style */}
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
                                {/* Fake QR Code */}
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
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome no Cartão</label>
                                <input type="text" placeholder="COMO NO CARTAO" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#009EE3]" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parcelas</label>
                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#009EE3]">
                                    <option>1x de R$ {booking.price},00 sem juros</option>
                                    <option>2x de R$ {(booking.price / 2).toFixed(2)} sem juros</option>
                                    <option>3x de R$ {(booking.price / 3).toFixed(2)} sem juros</option>
                                </select>
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
                        {loading ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Processando...
                            </>
                        ) : (
                            <>
                                🔒 Pagar R$ {booking.price},00
                            </>
                        )}
                    </button>
                    <div className="text-center mt-3 flex items-center justify-center gap-1 text-[10px] text-slate-400">
                        <span className="opacity-50">Protegido por</span>
                        <span className="font-black text-slate-500">mercadopago</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- New Component: Service Request Modal (Create Demand) ---
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
                            placeholder="Descreva o serviço com detalhes. Ex: Pintar 3 quartos e 1 sala, paredes na cor branca..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-28 resize-none"
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Seu WhatsApp (Contato)</label>
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
                                        ? (u === 'high' ? 'bg-red-500 text-white border-red-500' : u === 'medium' ? 'bg-amber-500 text-white border-amber-500' : 'bg-green-500 text-white border-green-500')
                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                    }`}
                                 >
                                     {u === 'low' ? 'Baixa' : u === 'medium' ? 'Média' : 'Alta'}
                                 </button>
                             ))}
                         </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800">
                        🔒 <strong>Segurança:</strong> Seu contato será revelado apenas para até 3 profissionais que usarem créditos para desbloqueá-lo.
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 mt-2"
                    >
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
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Estilo do Cartão (Classes CSS)</label>
            <select 
              value={formData.color} 
              onChange={e => setFormData({...formData, color: e.target.value})} 
              className="w-full p-2 border rounded-lg mb-2"
            >
               <option value="bg-slate-100 border-slate-200">Cinza (Padrão)</option>
               <option value="bg-blue-50 border-blue-200">Azul (Plus)</option>
               <option value="bg-amber-50 border-amber-200">Amarelo/Ouro (Premium)</option>
               <option value="bg-emerald-50 border-emerald-200">Verde (Ecológico/Especial)</option>
               <option value="bg-purple-50 border-purple-200">Roxo (Vip)</option>
            </select>
          </div>

          <div>
             <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Lista de Vantagens</label>
             <div className="space-y-2">
               {formData.features.map((feat, idx) => (
                 <div key={idx} className="flex gap-2">
                   <input 
                    type="text" 
                    value={feat} 
                    onChange={e => handleFeatureChange(idx, e.target.value)}
                    className="flex-grow p-2 border rounded-lg text-sm"
                    placeholder="Ex: Suporte 24h"
                   />
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


// --- DATA & HELPER FUNCTIONS ---

const INITIAL_PLANS: Plan[] = [
  {
    id: 'gratis',
    name: 'Grátis',
    price: '0',
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
    
    // Filter States
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [maxPrice, setMaxPrice] = useState<number>(300);
    const [minRating, setMinRating] = useState<number>(0);
    
    // State for Mobile Filter Toggle
    const [showFilters, setShowFilters] = useState(false);

    const filteredPros = useMemo(() => {
        return MOCK_PROS.filter(p => {
            // Text Search
            const matchText = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.services.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
            
            // City
            const matchCity = selectedCities.length === 0 || p.cities.some(c => selectedCities.includes(c));

            // Category (Service)
            const matchService = selectedServices.length === 0 || p.services.some(s => selectedServices.includes(s));

            // Price
            const matchPrice = p.basePrice <= maxPrice;

            // Rating
            const matchRating = p.rating >= minRating;

            return matchText && matchCity && matchService && matchPrice && matchRating;
        });
    }, [searchTerm, selectedCities, selectedServices, maxPrice, minRating]);

    const handleToggleService = (service: string) => {
        if (selectedServices.includes(service)) {
            setSelectedServices(selectedServices.filter(s => s !== service));
        } else {
            setSelectedServices([...selectedServices, service]);
        }
    };

    const handleToggleCity = (city: string) => {
        if (selectedCities.includes(city)) {
            setSelectedCities(selectedCities.filter(c => c !== city));
        } else {
            setSelectedCities([...selectedCities, city]);
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCities([]);
        setSelectedServices([]);
        setMaxPrice(300);
        setMinRating(0);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
            <h1 className="text-3xl font-black text-slate-800 mb-8">Todos os Profissionais</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Mobile Filter Toggle Button */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden w-full mb-2 bg-white p-4 rounded-2xl border border-slate-200 font-bold text-slate-700 shadow-sm flex justify-between items-center"
                >
                    <span className="flex items-center gap-2">
                        <span>⚙️</span> Filtros
                        {filteredPros.length > 0 && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs ml-2">{filteredPros.length} resultados</span>}
                    </span>
                    <span className="text-slate-400">{showFilters ? '▲' : '▼'}</span>
                </button>

                {/* --- Sidebar Filters --- */}
                <aside className={`w-full lg:w-72 shrink-0 space-y-8 transition-all duration-300 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                    {/* Filtros Container */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Filtros</h3>
                            <button onClick={clearFilters} className="text-xs font-bold text-blue-600 hover:text-blue-800">Limpar</button>
                        </div>

                        {/* Categorias */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Categorias</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {SERVICE_CONSTANTS.map(service => (
                                    <label key={service} className="flex items-center gap-2 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 accent-blue-600 rounded"
                                            checked={selectedServices.includes(service)}
                                            onChange={() => handleToggleService(service)}
                                        />
                                        <span className={`text-sm group-hover:text-blue-600 ${selectedServices.includes(service) ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                                            {service}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Cidades - Filtro Lateral */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Cidades (Vale do Ribeira)</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {CITY_CONSTANTS.map(city => (
                                    <label key={city} className="flex items-center gap-2 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 accent-blue-600 rounded"
                                            checked={selectedCities.includes(city)}
                                            onChange={() => handleToggleCity(city)}
                                        />
                                        <span className={`text-sm group-hover:text-blue-600 ${selectedCities.includes(city) ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                                            {city}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Preço */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase">Preço Máximo</h4>
                                <span className="text-sm font-bold text-slate-800">R$ {maxPrice}</span>
                            </div>
                            <input 
                                type="range" 
                                min="50" 
                                max="500" 
                                step="10" 
                                value={maxPrice} 
                                onChange={(e) => setMaxPrice(Number(e.target.value))}
                                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                <span>R$ 50</span>
                                <span>R$ 500+</span>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Avaliação */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Avaliação Mínima</h4>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="rating" 
                                        className="w-4 h-4 accent-blue-600"
                                        checked={minRating === 0}
                                        onChange={() => setMinRating(0)}
                                    />
                                    <span className="text-sm text-slate-600">Todas</span>
                                </label>
                                {[3, 4, 5].map(star => (
                                    <label key={star} className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="rating" 
                                            className="w-4 h-4 accent-blue-600"
                                            checked={minRating === star}
                                            onChange={() => setMinRating(star)}
                                        />
                                        <span className="text-sm text-slate-600 flex items-center">
                                            {star}+ <span className="text-amber-400 ml-1">★</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* --- Main Content --- */}
                <div className="flex-grow">
                    {/* Top Bar (Search Only) */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6">
                        <input 
                            type="text" 
                            placeholder="Buscar por nome ou serviço..." 
                            className="w-full h-10 px-4 rounded-lg bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Results Count */}
                    <p className="text-sm text-slate-500 mb-4 font-medium hidden lg:block">
                        Encontrados {filteredPros.length} profissionais
                    </p>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredPros.map((pro, index) => (
                            <ProCard 
                                key={pro.id} 
                                pro={pro} 
                                rank={index + 1}
                                onSelect={() => onViewProfile(pro)} 
                            />
                        ))}
                        {filteredPros.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                                <span className="text-4xl mb-2">🔍</span>
                                <p className="font-bold">Nenhum profissional encontrado</p>
                                <p className="text-sm">Tente ajustar os filtros ao lado.</p>
                                <button onClick={clearFilters} className="mt-4 text-blue-600 text-sm font-bold hover:underline">Limpar Filtros</button>
                            </div>
                        )}
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
}> = ({ requests, onViewRequest, addToast }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
    
    // State for Mobile Filter Toggle
    const [showFilters, setShowFilters] = useState(false);

    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            const matchText = req.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              req.category.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCity = selectedCities.length === 0 || selectedCities.includes(req.city);
            const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(req.category);
            const matchUrgency = urgencyFilter === 'all' || req.urgency === urgencyFilter;

            return matchText && matchCity && matchCategory && matchUrgency && req.status === 'open';
        });
    }, [requests, searchTerm, selectedCities, selectedCategories, urgencyFilter]);

    const handleToggleCategory = (cat: string) => {
        if (selectedCategories.includes(cat)) {
            setSelectedCategories(selectedCategories.filter(c => c !== cat));
        } else {
            setSelectedCategories([...selectedCategories, cat]);
        }
    };

    const handleToggleCity = (city: string) => {
        if (selectedCities.includes(city)) {
            setSelectedCities(selectedCities.filter(c => c !== city));
        } else {
            setSelectedCities([...selectedCities, city]);
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCities([]);
        setSelectedCategories([]);
        setUrgencyFilter('all');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
            <h1 className="text-3xl font-black text-slate-800 mb-8">Mural de Pedidos</h1>
            
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Mobile Filter Toggle Button */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden w-full mb-2 bg-white p-4 rounded-2xl border border-slate-200 font-bold text-slate-700 shadow-sm flex justify-between items-center"
                >
                    <span className="flex items-center gap-2">
                        <span>⚙️</span> Filtros
                        {filteredRequests.length > 0 && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs ml-2">{filteredRequests.length} resultados</span>}
                    </span>
                    <span className="text-slate-400">{showFilters ? '▲' : '▼'}</span>
                </button>

                {/* Filters Sidebar */}
                <aside className={`w-full lg:w-72 shrink-0 space-y-8 transition-all duration-300 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                     <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Filtros</h3>
                            <button onClick={clearFilters} className="text-xs font-bold text-blue-600 hover:text-blue-800">Limpar</button>
                        </div>

                         {/* Urgency */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Urgência</h4>
                            <div className="space-y-2">
                                {['all', 'low', 'medium', 'high'].map(u => (
                                    <label key={u} className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="urgency" 
                                            className="w-4 h-4 accent-blue-600"
                                            checked={urgencyFilter === u}
                                            onChange={() => setUrgencyFilter(u as any)}
                                        />
                                        <span className="text-sm text-slate-600 capitalize">
                                            {u === 'all' ? 'Todas' : u === 'low' ? 'Baixa' : u === 'medium' ? 'Média' : 'Alta'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Cities */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Cidades (Vale do Ribeira)</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {CITY_CONSTANTS.map(city => (
                                    <label key={city} className="flex items-center gap-2 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 accent-blue-600 rounded"
                                            checked={selectedCities.includes(city)}
                                            onChange={() => handleToggleCity(city)}
                                        />
                                        <span className={`text-sm group-hover:text-blue-600 ${selectedCities.includes(city) ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                                            {city}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Categories */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Categorias</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {SERVICE_CONSTANTS.map(cat => (
                                    <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 accent-blue-600 rounded"
                                            checked={selectedCategories.includes(cat)}
                                            onChange={() => handleToggleCategory(cat)}
                                        />
                                        <span className={`text-sm group-hover:text-blue-600 ${selectedCategories.includes(cat) ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                                            {cat}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-grow">
                     {/* Search Bar */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6">
                        <input 
                            type="text" 
                            placeholder="Buscar por descrição ou categoria..." 
                            className="w-full h-10 px-4 rounded-lg bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <p className="text-sm text-slate-500 mb-4 font-medium hidden lg:block">
                        {filteredRequests.length} oportunidades encontradas
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredRequests.map(req => (
                            <div key={req.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold uppercase">{req.category}</span>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${req.urgency === 'high' ? 'bg-red-100 text-red-600' : req.urgency === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                        Urgência {req.urgency === 'low' ? 'Baixa' : req.urgency === 'medium' ? 'Média' : 'Alta'}
                                    </span>
                                </div>
                                <p className="text-slate-800 font-medium mb-4 line-clamp-3 flex-grow">{req.description}</p>
                                
                                <div className="flex items-center text-xs text-slate-500 mb-6">
                                    <span>📍 {req.city}</span>
                                    <span className="mx-2">•</span>
                                    <span>Criado em: {new Date(req.createdAt).toLocaleDateString()}</span>
                                </div>

                                <button 
                                    onClick={() => onViewRequest(req)}
                                    className="w-full py-3 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors"
                                >
                                    Ver Detalhes
                                </button>
                            </div>
                        ))}
                         {filteredRequests.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                                <span className="text-4xl mb-2">🔍</span>
                                <p className="font-bold">Nenhum pedido encontrado</p>
                                <button onClick={clearFilters} className="mt-4 text-blue-600 text-sm font-bold hover:underline">Limpar Filtros</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfessionalProfileView: React.FC<{
    pro: Professional;
    onBack: () => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}> = ({ pro, onBack, addToast }) => {
    const [showBooking, setShowBooking] = useState(false);
    const reputation = getReputationInfo(pro);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
             <button onClick={onBack} className="mb-4 text-slate-500 hover:text-slate-800 font-bold">← Voltar</button>
             <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100">
                <div className="h-48 bg-slate-200 relative">
                     <img src={pro.photo} alt={pro.name} className="w-full h-full object-cover opacity-50" />
                     <div className="absolute -bottom-12 left-8">
                        <img src={pro.photo} alt={pro.name} className="w-32 h-32 rounded-full border-4 border-white shadow-md" />
                     </div>
                </div>
                <div className="pt-16 pb-8 px-8">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800">{pro.name}</h1>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-white ${reputation.color} mt-2`}>
                                {reputation.icon} {reputation.level}
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-2xl font-bold text-blue-600">R$ {pro.basePrice}</div>
                             <div className="text-sm text-slate-500">preço base</div>
                        </div>
                    </div>
                    
                    <p className="text-slate-600 mb-6">{pro.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                         <div className="bg-slate-50 p-4 rounded-xl">
                             <span className="block text-xs font-bold text-slate-400 uppercase">Serviços</span>
                             <div className="flex flex-wrap gap-1 mt-1">
                                {pro.services.map(s => <span key={s} className="bg-white border border-slate-200 px-2 py-1 rounded text-xs font-bold text-slate-600">{s}</span>)}
                             </div>
                         </div>
                         <div className="bg-slate-50 p-4 rounded-xl">
                             <span className="block text-xs font-bold text-slate-400 uppercase">Atende em</span>
                             <div className="mt-1 font-bold text-slate-700">{pro.cities.join(', ')}</div>
                         </div>
                    </div>

                    <button 
                        onClick={() => setShowBooking(true)}
                        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
                    >
                        Agendar Serviço
                    </button>
                </div>
             </div>
             {showBooking && (
                <BookingModal 
                    pro={pro} 
                    onClose={() => setShowBooking(false)} 
                    onConfirm={() => {
                        setShowBooking(false);
                        addToast("Solicitação enviada com sucesso!", "success");
                    }} 
                />
             )}
        </div>
    );
};

const ClientHomeView: React.FC<{ 
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void, 
    onNavigate: (view: string) => void, 
    plans: Plan[], 
    onViewProfile: (pro: Professional) => void,
    onRequestService: (req: any) => void 
}> = ({ addToast, onNavigate, plans, onViewProfile, onRequestService }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Home exibe apenas destaques (top 4 fixos para exemplo)
  const highlightedPros = MOCK_PROS.slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
       {/* Hero / Search */}
       <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">
            Encontre profissionais de confiança <br/> <span className="text-blue-600">no Vale do Ribeira</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Conectamos você aos melhores prestadores de serviço da região. Rápido, seguro e sem complicações.
          </p>
          
          <div className="bg-white p-4 rounded-3xl shadow-xl max-w-3xl mx-auto flex flex-col md:flex-row gap-4 border border-slate-100">
             <div className="flex-grow">
               <input 
                type="text" 
                placeholder="O que você precisa? (Ex: Eletricista, Limpeza)" 
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
               />
             </div>
             <div className="md:w-1/3">
                <select 
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedCity}
                  onChange={e => setSelectedCity(e.target.value)}
                >
                  <option value="">Todas as Cidades</option>
                  {CITY_CONSTANTS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
             <button 
               onClick={() => onNavigate('professionals')}
               className="h-12 px-8 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
             >
               🔍 Buscar
             </button>
          </div>
          
          <div className="mt-6">
              <span className="text-slate-500 text-sm">Não quer procurar? </span>
              <button 
                onClick={() => setIsRequestModalOpen(true)}
                className="text-blue-600 font-bold hover:underline"
              >
                  Publique um pedido e receba orçamentos
              </button>
          </div>
       </div>

       {/* Results */}
       <div className="mb-16">
          <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-black text-slate-800">Profissionais em Destaque</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {highlightedPros.map((pro, index) => (
                <ProCard 
                    key={pro.id} 
                    pro={pro} 
                    rank={index + 1}
                    onSelect={() => onViewProfile(pro)} 
                />
              ))}
          </div>

          <div className="text-center">
              <button 
                onClick={() => onNavigate('professionals')}
                className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                  Ver todos os profissionais
              </button>
          </div>
       </div>

       {/* NEW SECTION: Why Use Platform */}
       <div className="mb-16 bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-sm">
          <div className="text-center mb-10">
             <h2 className="text-3xl font-black text-slate-800 mb-4">Por que fechar pelo <span className="text-blue-600">Vale Conecta</span>?</h2>
             <p className="text-slate-600 max-w-2xl mx-auto">
               Criamos um ambiente seguro onde quem contrata tem garantia e quem trabalha tem certeza do recebimento.
               Veja as vantagens de manter tudo dentro da plataforma:
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
             {/* Client Benefits */}
             <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                   <span className="bg-blue-100 text-blue-600 p-2 rounded-lg text-2xl">👤</span>
                   <h3 className="text-xl font-bold text-slate-800">Para quem contrata</h3>
                </div>
                <ul className="space-y-4">
                   <li className="flex gap-3">
                      <div className="mt-1 bg-green-100 text-green-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</div>
                      <div>
                         <h4 className="font-bold text-slate-800">Pagamento Protegido (Escrow)</h4>
                         <p className="text-sm text-slate-600">Seu dinheiro fica no cofre do App e só vai para o profissional quando você confirmar que o serviço foi feito.</p>
                      </div>
                   </li>
                   <li className="flex gap-3">
                      <div className="mt-1 bg-green-100 text-green-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</div>
                      <div>
                         <h4 className="font-bold text-slate-800">Garantia contra Imprevistos</h4>
                         <p className="text-sm text-slate-600">Se o profissional não aparecer ou houver problemas, a plataforma devolve seu valor integralmente.</p>
                      </div>
                   </li>
                   <li className="flex gap-3">
                      <div className="mt-1 bg-green-100 text-green-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</div>
                      <div>
                         <h4 className="font-bold text-slate-800">Parcele em até 12x</h4>
                         <p className="text-sm text-slate-600">Facilite o pagamento de reformas e reparos maiores usando seu cartão de crédito.</p>
                      </div>
                   </li>
                </ul>
             </div>

             {/* Pro Benefits */}
             <div className="space-y-6 md:border-l md:border-slate-100 md:pl-12">
                <div className="flex items-center gap-3 mb-2">
                   <span className="bg-amber-100 text-amber-600 p-2 rounded-lg text-2xl">🛠️</span>
                   <h3 className="text-xl font-bold text-slate-800">Para o Profissional</h3>
                </div>
                 <ul className="space-y-4">
                   <li className="flex gap-3">
                      <div className="mt-1 bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</div>
                      <div>
                         <h4 className="font-bold text-slate-800">Fim dos Calotes</h4>
                         <p className="text-sm text-slate-600">O cliente paga antes. Você tem a certeza absoluta de que vai receber assim que terminar o trabalho.</p>
                      </div>
                   </li>
                   <li className="flex gap-3">
                      <div className="mt-1 bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</div>
                      <div>
                         <h4 className="font-bold text-slate-800">Reputação Verificada</h4>
                         <p className="text-sm text-slate-600">Serviços fechados pelo App geram avaliações oficiais. Quem tem mais estrelas cobra mais caro.</p>
                      </div>
                   </li>
                   <li className="flex gap-3">
                      <div className="mt-1 bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</div>
                      <div>
                         <h4 className="font-bold text-slate-800">Organização Automática</h4>
                         <p className="text-sm text-slate-600">Histórico de clientes, recibos e agenda tudo em um só lugar. Profissionalize sua gestão.</p>
                      </div>
                   </li>
                </ul>
             </div>
          </div>
       </div>

       {isRequestModalOpen && (
           <ServiceRequestModal 
                onClose={() => setIsRequestModalOpen(false)} 
                onConfirm={(req) => {
                    onRequestService(req);
                    setIsRequestModalOpen(false);
                }} 
            />
       )}
    </div>
  );
};

const ClientDashboardView: React.FC<{
    bookings: Booking[];
    requests: ServiceRequest[];
    onRequestService: (req: any) => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    onNavigate: (view: string) => void;
    onUpdateBookingStatus: (id: string, status: any) => void;
}> = ({ bookings, requests, onRequestService, onNavigate, addToast, onUpdateBookingStatus }) => {
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-black text-slate-800 mb-8">Minha Área</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold mb-4">Meus Pedidos</h2>
                    {requests.length === 0 ? (
                        <p className="text-slate-500">Você ainda não fez pedidos.</p>
                    ) : (
                        <div className="space-y-4">
                            {requests.map(req => (
                                <div key={req.id} className="p-4 border rounded-xl">
                                    <div className="font-bold">{req.category}</div>
                                    <div className="text-sm text-slate-500">{req.description}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    <button 
                        onClick={() => setIsRequestModalOpen(true)} 
                        className="mt-4 text-blue-600 font-bold hover:underline"
                    >
                        + Novo Pedido
                    </button>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold mb-4">Agendamentos</h2>
                    {bookings.length === 0 ? (
                        <p className="text-slate-500">Nenhum agendamento ativo.</p>
                    ) : (
                        <div className="space-y-4">
                            {bookings.map(book => (
                                <div key={book.id} className="p-4 border rounded-xl flex flex-col gap-3">
                                    <div className="flex justify-between">
                                        <div>
                                            <div className="font-bold">{book.service}</div>
                                            <div className="text-sm text-slate-500">com {book.proName}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">R$ {book.price}</div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                                                book.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                                                book.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                                                book.status === 'accepted' ? 'bg-amber-100 text-amber-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                                {book.status === 'paid' ? 'Pago (Garantia)' :
                                                 book.status === 'completed' ? 'Realizado' :
                                                 book.status === 'accepted' ? 'Aguardando Pagamento' : 
                                                 book.status}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Ações do Cliente */}
                                    {book.status === 'accepted' && (
                                        <button 
                                            onClick={() => setPaymentBooking(book)}
                                            className="w-full py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm"
                                        >
                                            💳 Pagar Agora (Garantia Escrow)
                                        </button>
                                    )}

                                    {book.status === 'completed' && (
                                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                                            <p className="text-xs text-purple-800 mb-2 font-bold">O profissional marcou como concluído.</p>
                                            <button 
                                                onClick={() => {
                                                    if(window.confirm(`O serviço foi realizado corretamente? Ao confirmar, o valor será liberado para o profissional.`)) {
                                                        onUpdateBookingStatus(book.id, 'finished'); // Final status
                                                        addToast("Valor liberado para o profissional! Obrigado.", "success");
                                                    }
                                                }}
                                                className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors shadow-sm"
                                            >
                                                ✅ Confirmar e Liberar Pagamento
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Render Request Modal */}
            {isRequestModalOpen && (
                <ServiceRequestModal 
                    onClose={() => setIsRequestModalOpen(false)} 
                    onConfirm={(req) => {
                        onRequestService(req);
                        setIsRequestModalOpen(false);
                    }} 
                />
            )}

            {/* Render Payment Modal */}
            {paymentBooking && (
                <PaymentModal
                    booking={paymentBooking}
                    onClose={() => setPaymentBooking(null)}
                    onSuccess={() => {
                        onUpdateBookingStatus(paymentBooking.id, 'paid');
                        setPaymentBooking(null);
                        addToast("Pagamento realizado! O valor está seguro no cofre do app.", "success");
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
}> = ({ plans, addToast }) => {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-black text-slate-800 mb-8">Administração</h1>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold mb-4">Planos de Assinatura</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans.map(plan => (
                        <div key={plan.id} className={`p-4 rounded-xl border-2 ${plan.recommended ? 'border-blue-500' : 'border-slate-200'}`}>
                            <h3 className="font-bold text-lg">{plan.name}</h3>
                            <div className="text-2xl font-black mt-2">R$ {plan.price}</div>
                            <div className="text-sm text-slate-500 mb-4">/{plan.period}</div>
                            <ul className="text-sm space-y-2 mb-4">
                                {plan.features.map((f, i) => <li key={i}>✓ {f}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>
                <p className="text-sm text-slate-500 mt-4 italic">Edição de planos desabilitada nesta demo.</p>
            </div>
        </div>
    );
};

const ServiceRequestDetailView: React.FC<{
    req: ServiceRequest,
    onBack: () => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    currentPro?: Professional | null;
    onUnlockContact: (reqId: string, cost: number) => void;
}> = ({ req, onBack, addToast, currentPro, onUnlockContact }) => {

    const UNLOCK_COST = 50;
    const isUnlocked = currentPro && req.unlockedBy.includes(currentPro.id);
    const whatsappLink = req.contactPhone ? `https://wa.me/55${req.contactPhone.replace(/\D/g,'')}` : '#';
    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

    const handleSendProposal = (details: { description: string; price: number; timeline: string }) => {
        addToast(`Sua proposta de R$ ${details.price} foi enviada com sucesso!`, "success");
        setIsProposalModalOpen(false);
        onBack();
    };

    const handleUnlock = () => {
        if (!currentPro) {
            addToast("Faça login como profissional para desbloquear.", "error");
            return;
        }
        if (currentPro.credits < UNLOCK_COST) {
            addToast("Créditos insuficientes. Recarregue sua carteira.", "error");
            return;
        }
        onUnlockContact(req.id, UNLOCK_COST);
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
             <button onClick={onBack} className="mb-6 text-slate-500 hover:text-slate-800 font-bold flex items-center gap-2">
                ← Voltar para o Mural
            </button>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-6">
                    <div>
                         <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-bold uppercase mb-2 inline-block">{req.category}</span>
                         <h1 className="text-2xl font-black text-slate-800">Pedido #{req.id.slice(-4)}</h1>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${req.urgency === 'high' ? 'bg-red-100 text-red-600' : req.urgency === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                        Urgência: {req.urgency === 'low' ? 'Baixa' : req.urgency === 'medium' ? 'Média' : 'Alta'}
                    </span>
                </div>

                <div className="prose prose-slate max-w-none mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Descrição do Serviço</h3>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        {req.description}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 rounded-xl border border-slate-100">
                        <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Localização</span>
                        <span className="text-slate-800 font-bold">📍 {req.city}</span>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-100">
                        <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Data de Criação</span>
                        <span className="text-slate-800 font-bold">📅 {new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Hybrid Model Section */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 mb-8">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        📱 Contato com o Cliente
                        {isUnlocked && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full uppercase">Desbloqueado</span>}
                    </h3>
                    
                    {isUnlocked ? (
                        <div className="animate-in fade-in zoom-in-95">
                            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-green-100 mb-4">
                                <div className="bg-green-100 p-3 rounded-full text-2xl">📞</div>
                                <div>
                                    <p className="font-bold text-slate-800 text-lg">{req.contactPhone || '(13) 99999-9999'}</p>
                                    <p className="text-xs text-slate-500">Contato liberado. Negocie com responsabilidade.</p>
                                </div>
                            </div>
                            <a 
                                href={whatsappLink} 
                                target="_blank" 
                                rel="noreferrer"
                                className="block w-full text-center bg-[#25D366] text-white font-bold py-3 rounded-xl hover:brightness-95 transition-all shadow-sm"
                            >
                                Iniciar conversa no WhatsApp
                            </a>
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-xl border border-slate-200 text-center">
                            <div className="text-4xl mb-2 filter blur-sm select-none opacity-50">📞 (13) 9XXXX-XXXX</div>
                            <p className="text-sm text-slate-500 mb-4">O contato deste cliente está oculto. Desbloqueie para negociar diretamente via WhatsApp.</p>
                            
                            <div className="flex flex-col items-center gap-2">
                                <button 
                                    onClick={handleUnlock}
                                    className="w-full bg-amber-400 text-amber-900 font-black py-3 rounded-xl hover:bg-amber-500 transition-colors shadow-sm flex items-center justify-center gap-2"
                                >
                                    🔓 Desbloquear Contato
                                    <span className="bg-white/30 px-2 py-0.5 rounded text-xs">-{UNLOCK_COST} Créditos</span>
                                </button>
                                {currentPro && (
                                    <span className="text-xs text-slate-400">
                                        Seu saldo atual: <strong>{currentPro.credits} créditos</strong>
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-8">
                    <h4 className="font-bold text-blue-900 mb-2">💡 Opção Segura (Escrow)</h4>
                    <p className="text-sm text-blue-800/80">
                        Você também pode enviar uma proposta formal pela plataforma. O pagamento do cliente fica garantido no nosso cofre até a conclusão.
                    </p>
                </div>

                <div className="flex gap-4">
                     <button 
                        onClick={onBack}
                        className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                     >
                        Cancelar
                     </button>
                     <button 
                        onClick={() => setIsProposalModalOpen(true)}
                        className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
                     >
                        Enviar Proposta (Escrow)
                     </button>
                </div>
            </div>

            {isProposalModalOpen && (
                <ProposalModal 
                    request={req}
                    onClose={() => setIsProposalModalOpen(false)}
                    onConfirm={handleSendProposal}
                />
            )}
        </div>
    );
};

const ProProfileEditor: React.FC<{
    pro: Professional;
    onSave: (updatedPro: Professional) => void;
    onCancel: () => void;
}> = ({ pro, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Professional>(pro);
    const [docsUploaded, setDocsUploaded] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            // In a real app, this would upload to server. Here we use FileReader for preview.
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setFormData({ ...formData, photo: ev.target.result as string });
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            // Simulate upload
            setTimeout(() => setDocsUploaded(true), 1000);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-black text-slate-800 mb-8">Editar Perfil Profissional</h1>
            
            <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                
                {/* Photo Upload */}
                <div className="flex items-center gap-6">
                    <div className="relative w-24 h-24">
                        <img src={formData.photo} alt="Profile" className="w-full h-full rounded-2xl object-cover shadow-md" />
                        <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-sm">
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            📷
                        </label>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Foto de Perfil</h3>
                        <p className="text-sm text-slate-500">Clique no ícone da câmera para alterar. Use uma foto clara e profissional.</p>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome Completo</label>
                        <input 
                            type="text" 
                            required
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Preço Base (Visita/Hora)</label>
                        <input 
                            type="number" 
                            required
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.basePrice}
                            onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Sobre Você</label>
                    <textarea 
                        required
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                {/* Services & Cities (Simplified as text for demo, ideally multi-select) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cidades de Atendimento</label>
                        <select 
                            multiple
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-32"
                            value={formData.cities}
                            onChange={(e) => {
                                const options = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                                setFormData({...formData, cities: options});
                            }}
                        >
                            {CITY_CONSTANTS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">Segure Ctrl (ou Cmd) para selecionar várias.</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Especialidades</label>
                        <select 
                            multiple
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-32"
                            value={formData.services}
                            onChange={(e) => {
                                const options = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                                setFormData({...formData, services: options});
                            }}
                        >
                            {SERVICE_CONSTANTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {/* Document Upload Section */}
                <div className="border-t border-slate-100 pt-6">
                    <h3 className="font-bold text-slate-800 mb-2">Verificação de Documentos</h3>
                    <p className="text-sm text-slate-500 mb-4">Envie foto do RG/CNH e Antecedentes Criminais para ganhar o selo de verificado.</p>
                    
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
                        <input type="file" id="docs" className="hidden" onChange={handleDocUpload} />
                        <label htmlFor="docs" className="cursor-pointer flex flex-col items-center">
                            <span className="text-4xl mb-2">📂</span>
                            <span className="font-bold text-blue-600">Clique para enviar documentos</span>
                            <span className="text-xs text-slate-400">PDF, JPG ou PNG</span>
                        </label>
                    </div>
                    
                    {docsUploaded && (
                        <div className="mt-3 bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 animate-in fade-in">
                            ✓ Documentos enviados para análise.
                        </div>
                    )}
                </div>

                <div className="flex gap-4 pt-4">
                    <button 
                        type="button" 
                        onClick={onCancel}
                        className="w-1/3 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit"
                        className="w-2/3 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
                    >
                        Salvar Alterações
                    </button>
                </div>
            </form>
        </div>
    );
};

const ProDashboardView: React.FC<{
  pro: Professional;
  bookings: Booking[];
  plans: Plan[];
  onUpdateStatus: (id: string, status: any) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onAddCredits: (amount: number) => void;
  onEditProfile: () => void;
}> = ({ pro, bookings, plans, onUpdateStatus, addToast, onAddCredits, onEditProfile }) => {
    const data = [
        { name: 'Seg', jobs: 2 },
        { name: 'Ter', jobs: 3 },
        { name: 'Qua', jobs: 1 },
        { name: 'Qui', jobs: 4 },
        { name: 'Sex', jobs: 5 },
        { name: 'Sab', jobs: 2 },
    ];

    const handleBuyCredits = () => {
        // Simulação de compra
        if(window.confirm("Comprar 100 créditos por R$ 29,90?")) {
            onAddCredits(100);
            addToast("Compra realizada! 100 créditos adicionados.", "success");
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                   <h1 className="text-3xl font-black text-slate-800">Painel do Profissional</h1>
                   <p className="text-slate-500">Bem-vindo de volta, {pro.name}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${pro.plan === SubscriptionPlan.PREMIUM ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        Plano {pro.plan}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Credit Wallet Card */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-1">Sua Carteira</h3>
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-4xl font-black">{pro.credits}</span>
                            <span className="text-sm font-bold text-amber-400 mb-1">Créditos</span>
                        </div>
                        <button 
                            onClick={handleBuyCredits}
                            className="w-full bg-amber-500 text-amber-950 font-bold py-2 rounded-lg hover:bg-amber-400 transition-colors text-xs uppercase tracking-wider"
                        >
                            + Comprar Créditos
                        </button>
                    </div>
                    <div className="absolute -right-4 -bottom-4 text-9xl opacity-10">🪙</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Saldo em Conta</h3>
                    <p className="text-2xl font-black text-slate-800">R$ 1.250,00</p>
                    <button className="text-blue-600 text-xs font-bold hover:underline mt-2">Solicitar Saque</button>
                </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Serviços Realizados</h3>
                    <p className="text-2xl font-black text-slate-800">24</p>
                    <span className="text-slate-400 text-xs">Este mês</span>
                </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Avaliação Média</h3>
                    <p className="text-2xl font-black text-slate-800 flex items-center gap-1">
                        4.9 <span className="text-amber-400 text-lg">★</span>
                    </p>
                    <span className="text-slate-400 text-xs">Baseado em 124 reviews</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ... (Existing Charts and Bookings list code remains similar but condensed for brevity) ... */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-lg mb-6">Desempenho Semanal</h3>
                        <div className="h-64">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip cursor={{fill: '#f1f5f9'}} />
                                    <Bar dataKey="jobs" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    {/* Bookings List Placeholder to save space - Logic is same as previous step */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-4">Próximos Agendamentos</h3>
                        <div className="text-slate-500 text-sm">Gerencie seus agendamentos confirmados aqui.</div>
                        <div className="divide-y divide-slate-100">
                            {bookings.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">Nenhum agendamento pendente.</div>
                            ) : (
                                bookings.map(booking => (
                                    <div key={booking.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                {booking.clientName.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{booking.clientName}</h4>
                                                <p className="text-sm text-slate-500">{booking.service} • {booking.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {booking.status === 'pending' && (
                                                <>
                                                    <button onClick={() => onUpdateStatus(booking.id, 'rejected')} className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-sm font-bold">Recusar</button>
                                                    <button onClick={() => onUpdateStatus(booking.id, 'accepted')} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-600 shadow-sm">Aceitar</button>
                                                </>
                                            )}
                                            {booking.status === 'accepted' && (
                                                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-xs font-bold animate-pulse">Aguardando Pagamento</span>
                                            )}
                                            {booking.status === 'paid' && (
                                                <button onClick={() => onUpdateStatus(booking.id, 'completed')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm">
                                                    Finalizar Serviço
                                                </button>
                                            )}
                                            {booking.status === 'completed' && (
                                                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-bold">Aguardando Cliente</span>
                                            )}
                                            {booking.status === 'finished' && (
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold">Concluído e Pago</span>
                                            )}
                                            {booking.status === 'rejected' && (
                                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-bold">Recusado</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">Dica do Dia</h3>
                            <p className="text-slate-300 text-sm mb-4">Mantenha seu perfil atualizado com fotos recentes dos seus trabalhos para atrair mais clientes.</p>
                            <button 
                                onClick={onEditProfile}
                                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold backdrop-blur-sm transition-colors"
                            >
                                Editar Perfil
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-lg mb-4 text-slate-800">Status da Conta</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Verificação de Identidade</span>
                                <span className="text-green-500 font-bold">✓ Aprovado</span>
                            </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Teste de Capacitação</span>
                                <span className="text-amber-500 font-bold">⚠ Pendente</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [view, setView] = useState('home');
    const [userRole, setUserRole] = useState<UserRole>('guest');
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [currentUser, setCurrentUser] = useState<Professional | null>(null);
    const [requests, setRequests] = useState<ServiceRequest[]>(INITIAL_REQUESTS);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
    
    // Selection state
    const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    
    // Helper to add toast
    const addToast = (msg: string, type: 'success' | 'error' | 'info') => {
        const newToast = { id: Date.now(), message: msg, type };
        setToasts(prev => [...prev, newToast]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== newToast.id)), 3000);
    };

    const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

    const handleNavigate = (newView: string) => setView(newView);

    const handleLogout = () => {
        setUserRole('guest');
        setCurrentUser(null);
        setView('home');
        addToast('Logout realizado com sucesso', 'info');
    };
    
    // Request creation logic (Centralized)
    const handleRequestService = (reqData: any) => {
        const newRequest: ServiceRequest = {
            ...reqData,
            id: `req_${Date.now()}`,
            status: 'open',
            clientId: 'me',
            createdAt: new Date().toISOString(),
            unlockedBy: [] // Auto-initialize empty array
        };
        setRequests([newRequest, ...requests]);
        addToast('Pedido publicado com sucesso!', 'success');
    };
    
    // Login Mock
    const loginAs = (role: UserRole) => {
        setUserRole(role);
        if (role === 'pro') {
            setCurrentUser(MOCK_PROS[0]);
            setView('pro-dashboard');
        } else if (role === 'client') {
            setView('client-dashboard');
        } else if (role === 'admin') {
            setView('admin-dashboard');
        }
        addToast(`Logado como ${role}`, 'success');
    };

    // Render logic
    const renderContent = () => {
        switch(view) {
            case 'home':
                return <ClientHomeView 
                    addToast={addToast} 
                    onNavigate={handleNavigate} 
                    plans={plans} 
                    onViewProfile={(pro) => { setSelectedPro(pro); handleNavigate('profile'); }}
                    onRequestService={handleRequestService}
                />;
            case 'professionals':
                return <ProfessionalsListView 
                    addToast={addToast} 
                    onViewProfile={(pro) => { setSelectedPro(pro); handleNavigate('profile'); }}
                />;
            case 'profile':
                if (!selectedPro) return <div onClick={() => handleNavigate('professionals')}>Voltar</div>;
                return <ProfessionalProfileView 
                    pro={selectedPro} 
                    onBack={() => handleNavigate('professionals')} 
                    addToast={addToast} 
                />;
            case 'requests-list':
                return <ServiceRequestsListView 
                    requests={requests} 
                    onViewRequest={(req) => { setSelectedRequest(req); handleNavigate('request-detail'); }}
                    addToast={addToast}
                />;
            case 'request-detail':
                if (!selectedRequest) return null;
                return <ServiceRequestDetailView 
                    req={selectedRequest}
                    onBack={() => handleNavigate('requests-list')}
                    addToast={addToast}
                    currentPro={currentUser}
                    onUnlockContact={(reqId, cost) => {
                         if(currentUser && currentUser.credits >= cost) {
                             const updatedRequests = requests.map(r => r.id === reqId ? {...r, unlockedBy: [...r.unlockedBy, currentUser.id]} : r);
                             setRequests(updatedRequests);
                             setSelectedRequest(updatedRequests.find(r => r.id === reqId) || null);
                             setCurrentUser({...currentUser, credits: currentUser.credits - cost});
                             addToast('Contato desbloqueado!', 'success');
                         } else {
                             addToast('Saldo insuficiente', 'error');
                         }
                    }}
                />;
            case 'client-dashboard':
                return <ClientDashboardView 
                    bookings={bookings} 
                    requests={requests.filter(r => r.clientId === 'me' || r.clientId === 'c1')} 
                    onRequestService={handleRequestService} 
                    addToast={addToast} 
                    onNavigate={handleNavigate}
                    onUpdateBookingStatus={(id, status) => {
                        setBookings(bookings.map(b => b.id === id ? {...b, status} : b));
                    }}
                />;
            case 'pro-dashboard':
                if (!currentUser) return null;
                return <ProDashboardView 
                    pro={currentUser} 
                    bookings={bookings} 
                    plans={plans} 
                    onUpdateStatus={(id, status) => setBookings(bookings.map(b => b.id === id ? {...b, status} : b))} 
                    addToast={addToast} 
                    onAddCredits={(amount) => setCurrentUser({...currentUser, credits: currentUser.credits + amount})}
                    onEditProfile={() => handleNavigate('pro-edit')}
                />;
            case 'pro-edit':
                 if (!currentUser) return null;
                 return <ProProfileEditor 
                    pro={currentUser}
                    onSave={(updated) => {
                        setCurrentUser(updated);
                        handleNavigate('pro-dashboard');
                        addToast('Perfil atualizado', 'success');
                    }}
                    onCancel={() => handleNavigate('pro-dashboard')}
                 />
            case 'admin-dashboard':
                return <AdminDashboardView plans={plans} onUpdatePlans={setPlans} addToast={addToast} />;
            case 'login':
                return (
                    <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                        <h2 className="text-2xl font-bold">Login Demo</h2>
                        <div className="flex gap-4">
                            <button onClick={() => { loginAs('client'); handleNavigate('client-dashboard'); }} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">Sou Cliente</button>
                            <button onClick={() => { loginAs('pro'); handleNavigate('pro-dashboard'); }} className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold">Sou Profissional</button>
                            <button onClick={() => { loginAs('admin'); handleNavigate('admin-dashboard'); }} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold">Sou Admin</button>
                        </div>
                    </div>
                );
            case 'register':
                return (
                     <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                        <h2 className="text-2xl font-bold">Cadastro</h2>
                        <p>Simulação de cadastro.</p>
                        <button onClick={() => handleNavigate('login')} className="text-blue-600 font-bold">Ir para Login</button>
                     </div>
                );
            default:
                return <div className="p-8 text-center">Página não encontrada (404)</div>;
        }
    };

    return (
        <Layout userRole={userRole} onLogout={handleLogout} onNavigate={handleNavigate}>
            {renderContent()}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </Layout>
    );
};

export default App;