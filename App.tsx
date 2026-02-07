import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Layout } from './components/Layout';
import { ProCard } from './components/ProCard';
import { Professional, ReputationLevel, ServiceRequest, UserRole } from './types';
import { MOCK_PROS, SERVICES as SERVICE_CONSTANTS, CITIES as CITY_CONSTANTS } from './constants';

const getReputationInfo = (p: Professional): { level: ReputationLevel, color: string, icon: string } => {
    if (p.reviewCount >= 100 && p.rating >= 4.9) return { level: 'Diamante', color: 'bg-cyan-500', icon: '💎' };
    if (p.reviewCount >= 50 && p.rating >= 4.8) return { level: 'Ouro', color: 'bg-yellow-400', icon: '🏆' };
    if (p.reviewCount >= 30 && p.rating >= 4.5) return { level: 'Prata', color: 'bg-slate-400', icon: '🥈' };
    if (p.reviewCount >= 10 && p.rating >= 4.0) return { level: 'Bronze', color: 'bg-amber-700', icon: '🥉' };
    return { level: 'Novato', color: 'bg-slate-500', icon: '🛡️' };
};

// Interface local para Planos (compatível com a estrutura visual existente)
interface PlanData {
    id: string;
    name: string;
    price: string;
    features: string[];
    highlight: boolean;
}

const CreateRequestForm: React.FC<{ 
    onSubmit: (req: ServiceRequest) => void; 
    onCancel: () => void 
}> = ({ onSubmit, onCancel }) => {
    const [category, setCategory] = useState(SERVICE_CONSTANTS[0]);
    const [description, setDescription] = useState('');
    const [city, setCity] = useState(CITY_CONSTANTS[0]);
    const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const newRequest: ServiceRequest = {
            id: Math.random().toString(36).substr(2, 9),
            clientId: 'current-user', // Mock ID
            category,
            description,
            city,
            urgency,
            status: 'open',
            createdAt: 'Agora', // Em uma app real, seria new Date().toISOString()
            unlockedBy: []
        };

        onSubmit(newRequest);
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button onClick={onCancel} className="mb-6 text-slate-500 hover:text-blue-600 flex items-center gap-2 font-medium">
                ← Voltar
            </button>
            
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                    <h1 className="text-2xl font-black text-slate-800">Solicitar Serviço</h1>
                    <p className="text-slate-500 mt-1">Descreva o que você precisa e receba orçamentos.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Categoria do Serviço</label>
                        <select 
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-700"
                        >
                            {SERVICE_CONSTANTS.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Onde será o serviço?</label>
                        <select 
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-700"
                        >
                            {CITY_CONSTANTS.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Descrição do Problema</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Preciso trocar a fiação do chuveiro que derreteu..."
                            className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-none text-slate-700"
                            required
                        />
                        <p className="text-xs text-slate-400 mt-2 text-right">{description.length}/500 caracteres</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Urgência</label>
                        <div className="grid grid-cols-3 gap-4">
                            <label className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-all ${urgency === 'low' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 hover:border-slate-200 text-slate-600'}`}>
                                <input type="radio" name="urgency" value="low" className="hidden" checked={urgency === 'low'} onChange={() => setUrgency('low')} />
                                <div className="text-2xl mb-1">📅</div>
                                <div className="font-bold text-sm">Baixa</div>
                                <div className="text-[10px] opacity-75">Pode esperar</div>
                            </label>
                            
                            <label className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-all ${urgency === 'medium' ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-slate-100 hover:border-slate-200 text-slate-600'}`}>
                                <input type="radio" name="urgency" value="medium" className="hidden" checked={urgency === 'medium'} onChange={() => setUrgency('medium')} />
                                <div className="text-2xl mb-1">⚡</div>
                                <div className="font-bold text-sm">Média</div>
                                <div className="text-[10px] opacity-75">Semana atual</div>
                            </label>

                            <label className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-all ${urgency === 'high' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-100 hover:border-slate-200 text-slate-600'}`}>
                                <input type="radio" name="urgency" value="high" className="hidden" checked={urgency === 'high'} onChange={() => setUrgency('high')} />
                                <div className="text-2xl mb-1">🔥</div>
                                <div className="font-bold text-sm">Alta</div>
                                <div className="text-[10px] opacity-75">Para hoje</div>
                            </label>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200">
                            Publicar Pedido
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RequestDetailsView: React.FC<{ 
    request: ServiceRequest; 
    onBack: () => void; 
}> = ({ request, onBack }) => {
    // Encontra os profissionais que desbloquearam este pedido (simulado)
    const interestedPros = MOCK_PROS.filter(pro => request.unlockedBy.includes(pro.id));

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen animate-in fade-in slide-in-from-right-8 duration-300">
            <button onClick={onBack} className="mb-6 text-slate-500 hover:text-blue-600 flex items-center gap-2 font-medium">
                ← Voltar para o Painel
            </button>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden mb-8">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                             <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                {request.category}
                            </span>
                            {request.urgency === 'high' && (
                                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                                    🔥 Urgente
                                </span>
                            )}
                            <span className="text-slate-400 text-sm flex items-center gap-1">🕒 Criado {request.createdAt}</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 mb-2">{request.description}</h1>
                        <p className="text-slate-500 flex items-center gap-2">
                            📍 {request.city}
                        </p>
                    </div>
                    <div className="shrink-0">
                         <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide ${request.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                            {request.status === 'open' ? '🟢 Aberto' : '🔴 Fechado'}
                         </span>
                    </div>
                </div>
                <div className="p-8 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-700 uppercase mb-4">Progresso do Pedido</h3>
                    <div className="flex items-center gap-4 relative">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10"></div>
                        <div className="flex flex-col items-center gap-2 bg-white p-2 rounded-lg border border-slate-100 shadow-sm z-10">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">1</div>
                            <span className="text-xs font-bold text-blue-600">Publicado</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 bg-white p-2 rounded-lg border border-slate-100 shadow-sm z-10 opacity-50">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">2</div>
                            <span className="text-xs font-bold text-slate-500">Negociação</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 bg-white p-2 rounded-lg border border-slate-100 shadow-sm z-10 opacity-50">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">3</div>
                            <span className="text-xs font-bold text-slate-500">Concluído</span>
                        </div>
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-4">Profissionais Interessados ({interestedPros.length})</h2>
            
            {interestedPros.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {interestedPros.map(pro => (
                        <div key={pro.id} className="relative">
                            <ProCard pro={pro} onSelect={() => {}} />
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-white/90 backdrop-blur-sm border-t border-slate-100 flex justify-between items-center rounded-b-2xl">
                                <button className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-sm">
                                    WhatsApp
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 animate-pulse">
                        📢
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-2">Aguardando contato</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Notificamos os profissionais da região sobre o seu pedido. 
                        Assim que alguém desbloquear o contato, o perfil aparecerá aqui.
                    </p>
                </div>
            )}
        </div>
    );
};

const ClientDashboard: React.FC<{ 
    requests: ServiceRequest[],
    onNavigate: (view: string) => void,
    onViewRequest: (req: ServiceRequest) => void 
}> = ({ requests, onNavigate, onViewRequest }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'my-requests' | 'wallet' | 'addresses' | 'profile'>('overview');
    
    // Filtra os pedidos ativos (para fins de demonstração, mostra todos os 'open')
    const activeRequests = requests.filter(r => r.status === 'open');

    // Mock Data para funcionalidades avançadas
    const mockAddresses = [
        { id: '1', label: 'Minha Casa', street: 'Rua das Flores, 123', city: 'Registro' },
        { id: '2', label: 'Escritório', street: 'Av. Wild José de Souza, 45', city: 'Registro' },
    ];

    const mockCards = [
        { id: '1', last4: '4242', brand: 'Mastercard', expiry: '12/28' },
    ];

    const mockTransactions = [
        { id: '1', desc: 'Serviço de Limpeza - Ana Maria', date: '10/05/2024', amount: 180.00, status: 'paid' },
        { id: '2', desc: 'Reparo Hidráulico - Marcos', date: '05/04/2024', amount: 120.00, status: 'paid' },
    ];

    const mockFavorites = MOCK_PROS.slice(0, 2);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-sm">
                            JS
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">João Silva</h1>
                            <p className="text-slate-500 text-sm">Cliente VIP • Registro, SP</p>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => onNavigate('create-request')} 
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md w-full md:w-auto flex items-center justify-center gap-2"
                >
                    <span>+</span> Novo Pedido
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-24">
                        <nav className="flex flex-col p-2 space-y-1">
                            <button 
                                onClick={() => setActiveTab('overview')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'overview' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <span>📊</span> Visão Geral
                            </button>
                            <button 
                                onClick={() => setActiveTab('my-requests')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'my-requests' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <span>📝</span> Meus Pedidos
                                {activeRequests.length > 0 && <span className="ml-auto bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">{activeRequests.length}</span>}
                            </button>
                            <button 
                                onClick={() => setActiveTab('wallet')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'wallet' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <span>💳</span> Carteira & Pagamentos
                            </button>
                            <button 
                                onClick={() => setActiveTab('addresses')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'addresses' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <span>📍</span> Endereços
                            </button>
                            <button 
                                onClick={() => setActiveTab('profile')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <span>⚙️</span> Perfil & Segurança
                            </button>
                        </nav>
                        <div className="p-4 mt-2 border-t border-slate-100">
                             <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-white shadow-lg">
                                <h3 className="font-bold text-sm mb-1">Precisa de ajuda?</h3>
                                <p className="text-blue-100 text-xs mb-3">Suporte disponível via WhatsApp.</p>
                                <button 
                                    onClick={() => window.open('https://wa.me/5513991472036', '_blank')}
                                    className="bg-white text-blue-600 w-full py-2 rounded-lg font-bold text-xs hover:bg-blue-50 transition-colors"
                                >
                                    Falar com Suporte
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* VISÃO GERAL */}
                    {activeTab === 'overview' && (
                        <>
                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Pedidos Ativos</p>
                                    <p className="text-3xl font-black text-slate-800 mt-2">{activeRequests.length}</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Total Gasto (Mês)</p>
                                    <p className="text-3xl font-black text-blue-600 mt-2">R$ 300,00</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Pontos Fidelidade</p>
                                    <p className="text-3xl font-black text-amber-500 mt-2">150 pts</p>
                                </div>
                            </div>

                            <h2 className="text-lg font-bold text-slate-800">Pedidos Recentes</h2>
                            {activeRequests.length > 0 ? (
                                <div className="space-y-4">
                                    {activeRequests.map(req => (
                                        <div key={req.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-bold uppercase">{req.category}</span>
                                                    <span className="text-slate-400 text-xs">• {req.createdAt}</span>
                                                </div>
                                                <h3 className="font-bold text-slate-800 line-clamp-1">{req.description}</h3>
                                                <p className="text-sm text-slate-500 mt-1">{req.unlockedBy.length} profissionais interessados</p>
                                            </div>
                                            <button 
                                                onClick={() => onViewRequest(req)} 
                                                className="px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors"
                                            >
                                                Detalhes
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-100 border-dashed">
                                    <p className="text-slate-400">Você não tem pedidos ativos.</p>
                                    <button onClick={() => onNavigate('create-request')} className="text-blue-600 font-bold hover:underline mt-2">Criar novo pedido</button>
                                </div>
                            )}

                            <h2 className="text-lg font-bold text-slate-800 mt-4">Profissionais Favoritos</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                {mockFavorites.map(pro => (
                                    <div key={pro.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                                        <img src={pro.photo} alt={pro.name} className="w-12 h-12 rounded-full object-cover" />
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">{pro.name}</h4>
                                            <p className="text-xs text-slate-500">{pro.services[0]}</p>
                                            <div className="flex items-center text-xs text-amber-500 font-bold mt-1">
                                                ★ {pro.rating}
                                            </div>
                                        </div>
                                        <button className="ml-auto text-blue-600 text-xs font-bold hover:underline">Contratar</button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* MEUS PEDIDOS */}
                    {activeTab === 'my-requests' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-800">Histórico de Pedidos</h2>
                                <select className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg px-3 py-2 outline-none">
                                    <option>Todos os pedidos</option>
                                    <option>Abertos</option>
                                    <option>Concluídos</option>
                                </select>
                            </div>

                            <div className="space-y-4">
                                {requests.map(req => (
                                    <div key={req.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase mb-2 ${req.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {req.status === 'open' ? 'Aberto' : 'Fechado'}
                                                </span>
                                                <h3 className="text-lg font-bold text-slate-800">{req.description}</h3>
                                                <p className="text-sm text-slate-500 mt-1">Categoria: {req.category} • {req.createdAt}</p>
                                            </div>
                                            <button 
                                                onClick={() => onViewRequest(req)}
                                                className="text-blue-600 font-bold text-sm hover:underline"
                                            >
                                                Ver Detalhes
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-400 border-t border-slate-50 pt-4">
                                            <span>📍 {req.city}</span>
                                            <span>•</span>
                                            <span>Urgência: {req.urgency === 'high' ? 'Alta' : req.urgency === 'medium' ? 'Média' : 'Baixa'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CARTEIRA */}
                    {activeTab === 'wallet' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800">Carteira & Pagamentos</h2>
                            
                            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl">💳</div>
                                <p className="text-slate-400 text-sm font-bold uppercase mb-1">Cartão Principal</p>
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="text-2xl font-mono tracking-wider">•••• •••• •••• {mockCards[0].last4}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase">Validade</p>
                                        <p className="font-bold">{mockCards[0].expiry}</p>
                                    </div>
                                    <div className="font-bold text-xl">{mockCards[0].brand}</div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm">
                                    + Adicionar Cartão
                                </button>
                                <button className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm">
                                    Histórico Completo
                                </button>
                            </div>

                            <h3 className="font-bold text-slate-800 mt-4">Últimas Transações</h3>
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                {mockTransactions.map((t) => (
                                    <div key={t.id} className="p-4 border-b border-slate-50 last:border-0 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-lg">💸</div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{t.desc}</p>
                                                <p className="text-xs text-slate-500">{t.date}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-slate-800">- R$ {t.amount.toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ENDEREÇOS */}
                    {activeTab === 'addresses' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-800">Meus Endereços</h2>
                                <button className="text-blue-600 font-bold text-sm hover:underline">+ Novo Endereço</button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                {mockAddresses.map(addr => (
                                    <div key={addr.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative group hover:border-blue-200 transition-colors">
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="text-slate-400 hover:text-blue-600">✏️</button>
                                            <button className="text-slate-400 hover:text-red-500">🗑️</button>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="text-2xl">🏠</div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{addr.label}</h4>
                                                <p className="text-slate-600 text-sm mt-1">{addr.street}</p>
                                                <p className="text-slate-500 text-xs mt-1">{addr.city}, SP</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PERFIL */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800">Dados Pessoais</h2>
                            
                            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label>
                                        <input type="text" defaultValue="João Silva" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">E-mail</label>
                                        <input type="email" defaultValue="joao.silva@email.com" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Telefone / WhatsApp</label>
                                        <input type="tel" defaultValue="(13) 99999-8888" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">CPF</label>
                                        <input type="text" defaultValue="***.***.***-**" disabled className="w-full px-4 py-3 rounded-xl bg-slate-100 text-slate-400 border-none cursor-not-allowed" />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg">
                                        Salvar Alterações
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4 text-lg">Segurança</h3>
                                <div className="flex items-center justify-between py-4 border-b border-slate-50">
                                    <div>
                                        <p className="font-bold text-slate-700">Alterar Senha</p>
                                        <p className="text-xs text-slate-500">Última alteração há 3 meses</p>
                                    </div>
                                    <button className="text-blue-600 text-sm font-bold hover:underline">Atualizar</button>
                                </div>
                                <div className="flex items-center justify-between py-4">
                                    <div>
                                        <p className="font-bold text-slate-700">Autenticação em 2 fatores</p>
                                        <p className="text-xs text-slate-500">Adicione uma camada extra de segurança</p>
                                    </div>
                                    <button className="text-slate-400 text-sm font-bold hover:text-blue-600">Ativar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ProDashboard: React.FC<{
    pro: Professional;
    onUpdate: (updates: Partial<Professional>) => void;
}> = ({ pro, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'profile' | 'financial'>('profile');
    
    // Estados locais para o formulário de perfil
    const [name, setName] = useState(pro.name);
    const [description, setDescription] = useState(pro.description);
    const [price, setPrice] = useState(pro.basePrice);
    const [pixKey, setPixKey] = useState(pro.pixKey || '');
    const [selectedServices, setSelectedServices] = useState<string[]>(pro.services);
    const [selectedCities, setSelectedCities] = useState<string[]>(pro.cities);

    const handleServiceToggle = (service: string) => {
        if (selectedServices.includes(service)) {
            setSelectedServices(selectedServices.filter(s => s !== service));
        } else {
            setSelectedServices([...selectedServices, service]);
        }
    };

    const handleCityToggle = (city: string) => {
        if (selectedCities.includes(city)) {
            setSelectedCities(selectedCities.filter(c => c !== city));
        } else {
            setSelectedCities([...selectedCities, city]);
        }
    };

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate({
            name,
            description,
            basePrice: Number(price),
            pixKey,
            services: selectedServices,
            cities: selectedCities
        });
        alert('Perfil atualizado com sucesso!');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
             {/* Header */}
             <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <img src={pro.photo} alt={pro.name} className="w-16 h-16 rounded-full border-4 border-white shadow-sm object-cover" />
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-slate-800">{pro.name}</h1>
                            {pro.verified && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold uppercase">Verificado</span>}
                        </div>
                        <p className="text-slate-500 text-sm">Painel do Profissional</p>
                    </div>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-400 font-bold uppercase">Saldo de Créditos</p>
                    <p className="text-xl font-black text-blue-600">{pro.credits} créditos</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                 {/* Sidebar Navigation */}
                 <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-24">
                        <nav className="flex flex-col p-2 space-y-1">
                            <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'overview' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                                <span>📊</span> Visão Geral
                            </button>
                            <button onClick={() => setActiveTab('services')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'services' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                                <span>🛠️</span> Meus Serviços
                            </button>
                             <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                                <span>👤</span> Editar Perfil
                            </button>
                            <button onClick={() => setActiveTab('financial')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'financial' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                                <span>💰</span> Financeiro
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-slate-800">Editar Perfil</h2>
                                <button type="button" onClick={() => alert('Feature de upload de foto em breve!')} className="text-blue-600 font-bold text-sm hover:underline">Alterar Foto</button>
                            </div>

                            <form onSubmit={handleSaveProfile} className="space-y-8">
                                {/* Informações Básicas */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-50 pb-2">Informações Básicas</h3>
                                    <div className="grid gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Nome de Exibição</label>
                                            <input 
                                                type="text" 
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Sobre Mim (Bio)</label>
                                            <textarea 
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
                                                className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                                placeholder="Descreva sua experiência e diferenciais..."
                                            />
                                            <p className="text-xs text-slate-400 mt-1 text-right">{description.length} caracteres</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Áreas de Atuação e Serviços */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-50 pb-2">Especialidades e Região</h3>
                                    
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-slate-700 mb-3">Serviços Oferecidos</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {SERVICE_CONSTANTS.map(service => (
                                                <label key={service} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedServices.includes(service) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedServices.includes(service)}
                                                        onChange={() => handleServiceToggle(service)}
                                                        className="w-5 h-5 accent-blue-600 rounded"
                                                    />
                                                    <span className={`text-sm ${selectedServices.includes(service) ? 'font-bold text-blue-700' : 'text-slate-600'}`}>{service}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-3">Cidades de Atendimento</label>
                                        <div className="flex flex-wrap gap-2">
                                            {CITY_CONSTANTS.map(city => (
                                                <button
                                                    type="button"
                                                    key={city}
                                                    onClick={() => handleCityToggle(city)}
                                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedCities.includes(city) ? 'bg-green-100 text-green-700 shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                >
                                                    {city} {selectedCities.includes(city) && '✓'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Preço e Pagamento */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-50 pb-2">Detalhes Comerciais</h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Preço Base (Visita/Hora)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                                <input 
                                                    type="number" 
                                                    value={price}
                                                    onChange={e => setPrice(Number(e.target.value))}
                                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Chave PIX (Para Recebimentos)</label>
                                            <input 
                                                type="text" 
                                                value={pixKey}
                                                onChange={e => setPixKey(e.target.value)}
                                                placeholder="CPF, E-mail ou Telefone"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button 
                                        type="submit" 
                                        className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                    >
                                        Salvar Perfil
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                    
                    {activeTab !== 'profile' && (
                        <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                             <p className="font-bold text-lg">Em desenvolvimento</p>
                             <p className="text-sm">Acesse a aba "Editar Perfil" para testar a funcionalidade.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const VerificationModal: React.FC<{
    pro: Professional;
    onClose: () => void;
    onApprove: () => void;
    onReject: () => void;
}> = ({ pro, onClose, onApprove, onReject }) => {
    // Documentos simulados
    const docs = [
        { name: 'Documento de Identidade (RG/CNH)', url: 'https://placehold.co/600x400/e2e8f0/475569?text=Documento+Frente' },
        { name: 'Documento de Identidade (Verso)', url: 'https://placehold.co/600x400/e2e8f0/475569?text=Documento+Verso' },
        { name: 'Comprovante de Residência', url: 'https://placehold.co/600x400/e2e8f0/475569?text=Comp.+Residencia' },
        { name: 'Certificado de Antecedentes', url: 'https://placehold.co/600x400/e2e8f0/475569?text=Antecedentes' },
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Verificação de Documentos</h2>
                        <p className="text-sm text-slate-500">Profissional: <span className="font-semibold text-slate-700">{pro.name}</span></p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {docs.map((doc, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <p className="font-bold text-sm text-slate-700 mb-3">{doc.name}</p>
                                <div className="aspect-video bg-slate-50 rounded-lg overflow-hidden border border-slate-100 relative group cursor-pointer">
                                    <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                        <span className="opacity-0 group-hover:opacity-100 bg-black/70 text-white text-xs px-2 py-1 rounded">Ampliar</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                        <span className="text-blue-600 text-xl">ℹ️</span>
                        <div>
                            <h4 className="font-bold text-blue-800 text-sm">Critérios de Aprovação</h4>
                            <ul className="text-xs text-blue-700 mt-1 space-y-1 list-disc pl-4">
                                <li>Documentos devem estar legíveis e dentro da validade.</li>
                                <li>Nome no documento deve coincidir com o cadastro.</li>
                                <li>Antecedentes criminais "Nada Consta".</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white z-10">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onReject}
                        className="px-4 py-2 bg-red-50 text-red-600 font-bold hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                    >
                        Rejeitar Documentação
                    </button>
                    <button 
                        onClick={onApprove}
                        className="px-6 py-2 bg-green-600 text-white font-bold hover:bg-green-700 rounded-lg shadow-md transition-colors"
                    >
                        Aprovar Profissional
                    </button>
                </div>
            </div>
        </div>
    );
};

const PlanEditorModal: React.FC<{
    plan: PlanData;
    onClose: () => void;
    onSave: (updatedPlan: PlanData) => void;
}> = ({ plan, onClose, onSave }) => {
    const [name, setName] = useState(plan.name);
    const [price, setPrice] = useState(plan.price);
    const [highlight, setHighlight] = useState(plan.highlight);
    const [featuresText, setFeaturesText] = useState(plan.features.join('\n'));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...plan,
            name,
            price,
            highlight,
            features: featuresText.split('\n').filter(line => line.trim() !== '')
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800">Editar Plano</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Plano</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Preço (Texto)</label>
                        <input 
                            type="text" 
                            value={price} 
                            onChange={e => setPrice(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Funcionalidades (uma por linha)</label>
                        <textarea 
                            value={featuresText}
                            onChange={e => setFeaturesText(e.target.value)}
                            className="w-full h-32 px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            required
                        />
                    </div>
                    <div className="flex items-center gap-3">
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={highlight} onChange={e => setHighlight(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-medium text-slate-700">Destacar este plano</span>
                        </label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-lg shadow-md transition-colors">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC<{
    pros: Professional[];
    requests: ServiceRequest[];
    plans: PlanData[];
    onUpdatePro: (proId: string, updates: Partial<Professional>) => void;
    onUpdateRequest: (reqId: string, updates: Partial<ServiceRequest>) => void;
    onUpdatePlan: (plan: PlanData) => void;
}> = ({ pros, requests, plans, onUpdatePro, onUpdateRequest, onUpdatePlan }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'pros' | 'requests' | 'financial' | 'plans'>('overview');
    const [selectedProForVerification, setSelectedProForVerification] = useState<Professional | null>(null);
    const [editingPlan, setEditingPlan] = useState<PlanData | null>(null);

    // Estado para as solicitações de saque (Payouts)
    const [payouts, setPayouts] = useState([
        { id: 'w1', proName: 'Carlos Oliveira', amount: 450.00, requestDate: '14/05/2024', pixKey: '321.654.987-00', status: 'pending' },
        { id: 'w2', proName: 'Ana Maria Silva', amount: 180.00, requestDate: '13/05/2024', pixKey: 'ana.mary@email.com', status: 'pending' },
        { id: 'w3', proName: 'Marcos Hidráulica', amount: 320.00, requestDate: '10/05/2024', pixKey: '(13) 99888-7777', status: 'paid' },
    ]);

    const stats = {
        totalPros: pros.length,
        verifiedPros: pros.filter(p => p.verified).length,
        pendingPros: pros.filter(p => !p.verified).length,
        totalRequests: requests.length,
        openRequests: requests.filter(r => r.status === 'open').length,
    };

    // Dados Mockados para o Financeiro
    const financialData = {
        totalRevenue: 12580.00,
        monthlyRevenue: 3240.50,
        activeSubscriptions: 85,
        pendingPayments: 450.00,
        history: [
            { month: 'Jan', value: 2400 },
            { month: 'Fev', value: 1398 },
            { month: 'Mar', value: 9800 },
            { month: 'Abr', value: 3908 },
            { month: 'Mai', value: 4800 },
            { month: 'Jun', value: 3800 },
        ],
        recentTransactions: [
            { id: 1, pro: 'Carlos Oliveira', type: 'Assinatura Premium', value: 89.90, date: '12/05/2024', status: 'paid' },
            { id: 2, pro: 'Ana Maria', type: 'Pacote de Créditos', value: 49.90, date: '11/05/2024', status: 'paid' },
            { id: 3, pro: 'Marcos Hidráulica', type: 'Assinatura Plus', value: 29.90, date: '10/05/2024', status: 'pending' },
            { id: 4, pro: 'José Pinturas', type: 'Pacote de Créditos', value: 19.90, date: '09/05/2024', status: 'paid' },
        ]
    };

    const handleVerifyClick = (pro: Professional) => {
        setSelectedProForVerification(pro);
    };

    const handleApprove = () => {
        if (selectedProForVerification) {
            onUpdatePro(selectedProForVerification.id, { verified: true, verificationStatus: 'verified' });
            setSelectedProForVerification(null);
        }
    };

    const handleReject = () => {
        if (selectedProForVerification) {
            onUpdatePro(selectedProForVerification.id, { verified: false, verificationStatus: 'rejected' });
            setSelectedProForVerification(null);
        }
    };

    const handleApprovePayout = (id: string) => {
        setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'paid' } : p));
    };

    const handleRejectPayout = (id: string) => {
        setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' } : p));
    };

    const handleSavePlan = (updatedPlan: PlanData) => {
        onUpdatePlan(updatedPlan);
        setEditingPlan(null);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {selectedProForVerification && (
                <VerificationModal 
                    pro={selectedProForVerification}
                    onClose={() => setSelectedProForVerification(null)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                />
            )}
            
            {editingPlan && (
                <PlanEditorModal 
                    plan={editingPlan}
                    onClose={() => setEditingPlan(null)}
                    onSave={handleSavePlan}
                />
            )}

            {/* Admin Header */}
            <div className="bg-slate-900 text-white pt-10 pb-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Admin</span>
                        <span className="text-slate-400 text-sm">Painel de Controle</span>
                    </div>
                    <h1 className="text-3xl font-black">Gestão da Plataforma</h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 -mt-10">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-slate-500 text-xs font-bold uppercase">Total Profissionais</p>
                        <p className="text-3xl font-black text-slate-800 mt-2">{stats.totalPros}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-slate-500 text-xs font-bold uppercase">Pendentes</p>
                        <p className="text-3xl font-black text-amber-500 mt-2">{stats.pendingPros}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-slate-500 text-xs font-bold uppercase">Pedidos Abertos</p>
                        <p className="text-3xl font-black text-blue-600 mt-2">{stats.openRequests}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-slate-500 text-xs font-bold uppercase">Receita (Est.)</p>
                        <p className="text-3xl font-black text-green-600 mt-2">R$ 12.580</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
                    <div className="flex border-b border-slate-100 overflow-x-auto">
                        <button 
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-4 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            📊 Visão Geral
                        </button>
                        <button 
                            onClick={() => setActiveTab('pros')}
                            className={`px-6 py-4 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'pros' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            👷 Gerenciar Profissionais
                        </button>
                        <button 
                            onClick={() => setActiveTab('requests')}
                            className={`px-6 py-4 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'requests' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            📝 Monitorar Pedidos
                        </button>
                        <button 
                            onClick={() => setActiveTab('financial')}
                            className={`px-6 py-4 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'financial' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            💰 Controle Financeiro
                        </button>
                         <button 
                            onClick={() => setActiveTab('plans')}
                            className={`px-6 py-4 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'plans' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            💎 Gerenciar Planos
                        </button>
                    </div>

                    <div className="p-6">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <h3 className="font-bold text-lg text-slate-800">Atividade Recente</h3>
                                <div className="space-y-4">
                                    {/* Mock Activity Feed */}
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">👤</div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Novo cadastro: Eletricista João</p>
                                            <p className="text-xs text-slate-500">Há 5 minutos • Aguardando verificação</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">💰</div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Pagamento confirmado: Plano Premium</p>
                                            <p className="text-xs text-slate-500">Há 2 horas • Profissional Carlos Oliveira</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">⚠️</div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Denúncia: Serviço não realizado</p>
                                            <p className="text-xs text-slate-500">Há 1 dia • Pedido #1239</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'pros' && (
                            <div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <th className="p-4">Profissional</th>
                                                <th className="p-4">Serviços</th>
                                                <th className="p-4">Cidade</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {pros.map(pro => (
                                                <tr key={pro.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-4 font-bold text-slate-700 flex items-center gap-3">
                                                        <img src={pro.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                        {pro.name}
                                                    </td>
                                                    <td className="p-4 text-slate-600 max-w-[200px] truncate">{pro.services.join(', ')}</td>
                                                    <td className="p-4 text-slate-600">{pro.cities[0]}</td>
                                                    <td className="p-4">
                                                        {pro.verified ? (
                                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Verificado</span>
                                                        ) : (
                                                            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold">Pendente</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {pro.verified ? (
                                                            <button 
                                                                onClick={() => onUpdatePro(pro.id, { verified: false, verificationStatus: 'unverified' })}
                                                                className="text-red-500 font-bold hover:bg-red-50 px-3 py-1 rounded transition-colors"
                                                            >
                                                                Bloquear
                                                            </button>
                                                        ) : (
                                                            <div className="flex justify-end gap-2">
                                                                <button 
                                                                    onClick={() => handleVerifyClick(pro)}
                                                                    className="bg-blue-600 text-white font-bold px-3 py-1 rounded shadow-sm hover:bg-blue-700 transition-colors"
                                                                >
                                                                    Verificar Docs
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'requests' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <th className="p-4">Data</th>
                                            <th className="p-4">Categoria</th>
                                            <th className="p-4">Descrição</th>
                                            <th className="p-4">Cidade</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {requests.map(req => (
                                            <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 text-slate-500 whitespace-nowrap">{req.createdAt}</td>
                                                <td className="p-4 font-bold text-slate-700">{req.category}</td>
                                                <td className="p-4 text-slate-600 max-w-[300px] truncate" title={req.description}>{req.description}</td>
                                                <td className="p-4 text-slate-600">{req.city}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        {req.status === 'open' ? 'Aberto' : 'Fechado'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {req.status === 'open' ? (
                                                        <button 
                                                            onClick={() => onUpdateRequest(req.id, { status: 'closed' })}
                                                            className="text-red-500 hover:bg-red-50 font-bold px-3 py-1 rounded transition-colors text-xs"
                                                        >
                                                            Fechar
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => onUpdateRequest(req.id, { status: 'open' })}
                                                            className="text-blue-500 hover:bg-blue-50 font-bold px-3 py-1 rounded transition-colors text-xs"
                                                        >
                                                            Reabrir
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'financial' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Financial KPIs */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <p className="text-slate-500 text-xs font-bold uppercase">Receita Total</p>
                                        <p className="text-2xl font-black text-slate-800">R$ {financialData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <p className="text-slate-500 text-xs font-bold uppercase">Receita Recorrente (MRR)</p>
                                        <p className="text-2xl font-black text-green-600">R$ {financialData.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <p className="text-slate-500 text-xs font-bold uppercase">Assinantes Ativos</p>
                                        <p className="text-2xl font-black text-blue-600">{financialData.activeSubscriptions}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <p className="text-slate-500 text-xs font-bold uppercase">Pagamentos Pendentes</p>
                                        <p className="text-2xl font-black text-amber-500">R$ {financialData.pendingPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Chart */}
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
                                        <h3 className="font-bold text-slate-800 mb-6">Evolução da Receita (6 Meses)</h3>
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={financialData.history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `R$ ${val}`} />
                                                    <Tooltip 
                                                        cursor={{fill: '#f1f5f9'}}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                        {financialData.history.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={index === financialData.history.length - 1 ? '#2563eb' : '#94a3b8'} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Recent Transactions */}
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-bold text-slate-800">Últimas Transações</h3>
                                            <button className="text-blue-600 text-sm font-bold hover:underline">Ver todas</button>
                                        </div>
                                        <div className="space-y-4">
                                            {financialData.recentTransactions.map((t) => (
                                                <div key={t.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${t.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                                            {t.type.includes('Assinatura') ? '📅' : '⚡'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">{t.pro}</p>
                                                            <p className="text-xs text-slate-500">{t.type} • {t.date}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-slate-800">R$ {t.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                        <span className={`text-[10px] font-bold uppercase ${t.status === 'paid' ? 'text-green-600' : 'text-amber-500'}`}>
                                                            {t.status === 'paid' ? 'Pago' : 'Pendente'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Payout Requests Section */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8">
                                    <h3 className="font-bold text-slate-800 mb-6">Solicitações de Saque (Profissionais)</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                                                    <th className="p-4">Profissional</th>
                                                    <th className="p-4">Chave PIX</th>
                                                    <th className="p-4">Data</th>
                                                    <th className="p-4">Valor</th>
                                                    <th className="p-4">Status</th>
                                                    <th className="p-4 text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm">
                                                {payouts.map(pay => (
                                                    <tr key={pay.id}>
                                                        <td className="p-4 font-bold text-slate-700">{pay.proName}</td>
                                                        <td className="p-4 text-slate-600 font-mono text-xs">{pay.pixKey}</td>
                                                        <td className="p-4 text-slate-600">{pay.requestDate}</td>
                                                        <td className="p-4 font-bold text-slate-800">R$ {pay.amount.toFixed(2)}</td>
                                                        <td className="p-4">
                                                             <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                                                pay.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                                pay.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                'bg-amber-100 text-amber-700'
                                                            }`}>
                                                                {pay.status === 'paid' ? 'Pago' : pay.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            {pay.status === 'pending' && (
                                                                <div className="flex justify-end gap-2">
                                                                    <button onClick={() => handleApprovePayout(pay.id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700">Pagar</button>
                                                                    <button onClick={() => handleRejectPayout(pay.id)} className="bg-slate-100 text-slate-600 px-3 py-1 rounded text-xs font-bold hover:bg-slate-200">Rejeitar</button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'plans' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {plans.map(plan => (
                                    <div key={plan.id} className={`bg-white rounded-2xl p-6 shadow-sm border relative transition-all hover:shadow-md ${plan.highlight ? 'border-blue-500 ring-4 ring-blue-50 scale-105 z-10' : 'border-slate-200'}`}>
                                        {plan.highlight && (
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                                Destaque
                                            </div>
                                        )}
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-bold text-slate-800 text-lg">{plan.name}</h3>
                                            <button 
                                                onClick={() => setEditingPlan(plan)}
                                                className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors"
                                                title="Editar Plano"
                                            >
                                                ✏️
                                            </button>
                                        </div>
                                        <p className="text-3xl font-black text-slate-800 mb-4">{plan.price}</p>
                                        <ul className="space-y-3 mb-8 min-h-[120px]">
                                            {plan.features.map((feat, idx) => (
                                                <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                                    <span className="text-green-500 font-bold mt-0.5">✓</span>
                                                    <span className="flex-1">{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <button 
                                            onClick={() => setEditingPlan(plan)}
                                            className={`w-full py-3 rounded-xl font-bold transition-colors shadow-sm ${plan.highlight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            Editar Detalhes
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const RequestsListView: React.FC<{ requests: ServiceRequest[] }> = ({ requests }) => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Pedidos Recentes na Região</h2>
            <div className="space-y-4">
                {requests.filter(r => r.status === 'open').length === 0 ? (
                     <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-500">Nenhum pedido aberto no momento.</p>
                     </div>
                ) : (
                    requests.filter(r => r.status === 'open').map(req => (
                        <div key={req.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-bold uppercase">{req.category}</span>
                                <span className="text-slate-400 text-xs flex items-center gap-1">🕒 {req.createdAt}</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">{req.description}</h3>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span>📍 {req.city}</span>
                                <span className={`font-bold ${req.urgency === 'high' ? 'text-red-500' : 'text-slate-500'}`}>
                                    {req.urgency === 'high' ? '🔥 Urgente' : req.urgency === 'medium' ? '⚡ Média' : '📅 Baixa'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState('home');
    const [userRole, setUserRole] = useState<UserRole>('guest');
    const [requests, setRequests] = useState<ServiceRequest[]>([
        {
            id: '101',
            clientId: 'u1',
            category: 'Elétrica',
            description: 'Instalação de chuveiro elétrico e troca de disjuntor.',
            city: 'Registro',
            urgency: 'medium',
            status: 'open',
            createdAt: '10/05/2024',
            unlockedBy: ['1']
        },
        {
            id: '102',
            clientId: 'u1',
            category: 'Limpeza e Diarista',
            description: 'Faxina completa pós-obra em apartamento de 3 quartos.',
            city: 'Jacupiranga',
            urgency: 'high',
            status: 'open',
            createdAt: '12/05/2024',
            unlockedBy: []
        }
    ]);
    const [pros, setPros] = useState<Professional[]>(MOCK_PROS);
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    const [currentProId, setCurrentProId] = useState('1'); // Mock logged in pro ID

    // Initial Plans Data
    const [plans, setPlans] = useState<PlanData[]>([
        {
            id: 'p1',
            name: 'Plano Grátis',
            price: 'R$ 0,00',
            features: ['Perfil Básico', '1 Foto no Portfólio', 'Visualizar Pedidos (Sem contato)'],
            highlight: false
        },
        {
            id: 'p2',
            name: 'Plano Plus',
            price: 'R$ 29,90/mês',
            features: ['Perfil Destacado', '10 Fotos no Portfólio', '5 Desbloqueios de Contato/mês', 'Selo de Verificação'],
            highlight: true
        },
        {
            id: 'p3',
            name: 'Plano Premium',
            price: 'R$ 89,90/mês',
            features: ['Topo das Buscas', 'Fotos Ilimitadas', 'Desbloqueios Ilimitados', 'Suporte Prioritário', 'Taxa Zero em Serviços'],
            highlight: false
        }
    ]);

    const handleCreateRequest = (req: ServiceRequest) => {
        setRequests([req, ...requests]);
        setCurrentView('client-dashboard');
        // Auto-login as client for demo
        setUserRole('client');
    };

    const handleUpdatePro = (proId: string, updates: Partial<Professional>) => {
        setPros(pros.map(p => p.id === proId ? { ...p, ...updates } : p));
    };

    const handleUpdateRequest = (reqId: string, updates: Partial<ServiceRequest>) => {
        setRequests(requests.map(r => r.id === reqId ? { ...r, ...updates } : r));
    };

    const handleUpdatePlan = (updatedPlan: PlanData) => {
        setPlans(prevPlans => prevPlans.map(p => {
            if (p.id === updatedPlan.id) {
                return updatedPlan;
            }
            // Se o plano atualizado for destacado, remove destaque dos outros para garantir exclusividade
            if (updatedPlan.highlight) {
                return { ...p, highlight: false };
            }
            return p;
        }));
    };
    
    // Navigation Guard & Role Simulation
    const navigate = (view: string) => {
        if (view === 'login') {
            // Simula login de admin se clicar em login
            setUserRole('admin');
            setCurrentView('admin-dashboard');
        } else if (view === 'register') {
            setUserRole('client');
            setCurrentView('client-dashboard');
        } else if (view === 'logout') {
            setUserRole('guest');
            setCurrentView('home');
        } else {
            setCurrentView(view);
        }
    };

    const renderContent = () => {
        switch (currentView) {
            case 'home':
                return (
                    <div className="max-w-7xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="text-center mb-16">
                            <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100">
                                Vale do Ribeira
                            </span>
                            <h1 className="text-4xl md:text-6xl font-black text-slate-800 mb-6 tracking-tight leading-tight">
                                Conectando quem precisa <br/>
                                <span className="text-blue-600 bg-clip-text">a quem sabe fazer.</span>
                            </h1>
                            <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
                                A plataforma oficial da nossa região para contratar serviços domésticos, reformas e manutenções com segurança e agilidade.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <button onClick={() => navigate('create-request')} className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 hover:-translate-y-1 flex items-center justify-center gap-2">
                                    <span>🔍</span> Quero Contratar
                                </button>
                                <button onClick={() => {
                                    // Simula login como profissional para demo
                                    setUserRole('pro');
                                    setCurrentView('pro-dashboard');
                                }} className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                    <span>👷</span> Sou Profissional
                                </button>
                            </div>
                        </div>

                        <div className="mb-8 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-slate-800">Profissionais em Destaque</h2>
                            <button onClick={() => navigate('professionals')} className="text-blue-600 font-bold hover:underline">Ver todos</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                             {pros.slice(0, 4).map((pro, idx) => (
                                <ProCard key={pro.id} pro={pro} onSelect={(id) => console.log(id)} rank={idx + 1} />
                             ))}
                        </div>

                        {/* Seção "Por que fechar pelo Vale Conecta?" */}
                        <div className="mb-20 bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-black text-slate-800 mb-4">
                                    Por que fechar pelo <span className="text-blue-600">Vale Conecta</span>?
                                </h2>
                                <p className="text-slate-500 max-w-2xl mx-auto">
                                    Criamos um ambiente seguro onde quem contrata tem garantia e quem trabalha tem certeza do recebimento. Veja as vantagens de manter tudo dentro da plataforma:
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                                {/* Coluna Cliente */}
                                <div>
                                    <div className="flex items-center gap-3 mb-6 bg-blue-50 w-fit px-4 py-2 rounded-xl">
                                        <span className="text-2xl">👤</span>
                                        <h3 className="font-bold text-slate-800 text-lg">Para quem contrata</h3>
                                    </div>
                                    <ul className="space-y-6">
                                        <li className="flex gap-4">
                                            <div className="shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs mt-0.5">✓</div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">Pagamento Protegido (Escrow)</h4>
                                                <p className="text-sm text-slate-500 mt-1">Seu dinheiro fica no cofre do App e só vai para o profissional quando você confirmar que o serviço foi feito.</p>
                                            </div>
                                        </li>
                                        <li className="flex gap-4">
                                            <div className="shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs mt-0.5">✓</div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">Garantia contra Imprevistos</h4>
                                                <p className="text-sm text-slate-500 mt-1">Se o profissional não aparecer ou houver problemas, a plataforma devolve seu valor integralmente.</p>
                                            </div>
                                        </li>
                                        <li className="flex gap-4">
                                            <div className="shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs mt-0.5">✓</div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">Parcele em até 12x</h4>
                                                <p className="text-sm text-slate-500 mt-1">Facilite o pagamento de reformas e reparos maiores usando seu cartão de crédito.</p>
                                            </div>
                                        </li>
                                    </ul>
                                </div>

                                {/* Coluna Profissional */}
                                <div>
                                    <div className="flex items-center gap-3 mb-6 bg-yellow-50 w-fit px-4 py-2 rounded-xl">
                                        <span className="text-2xl">🛠️</span>
                                        <h3 className="font-bold text-slate-800 text-lg">Para o Profissional</h3>
                                    </div>
                                    <ul className="space-y-6">
                                        <li className="flex gap-4">
                                            <div className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mt-0.5">✓</div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">Fim dos Calotes</h4>
                                                <p className="text-sm text-slate-500 mt-1">O cliente paga antes. Você tem a certeza absoluta de que vai receber assim que terminar o trabalho.</p>
                                            </div>
                                        </li>
                                        <li className="flex gap-4">
                                            <div className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mt-0.5">✓</div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">Reputação Verificada</h4>
                                                <p className="text-sm text-slate-500 mt-1">Serviços fechados pelo App geram avaliações oficiais. Quem tem mais estrelas cobra mais caro.</p>
                                            </div>
                                        </li>
                                        <li className="flex gap-4">
                                            <div className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mt-0.5">✓</div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">Organização Automática</h4>
                                                <p className="text-sm text-slate-500 mt-1">Histórico de clientes, recibos e agenda tudo em um só lugar. Profissionalize sua gestão.</p>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="mb-16">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-black text-slate-800">Planos para Profissionais</h2>
                                <p className="text-slate-500 mt-2">Escolha a melhor opção para impulsionar sua carreira.</p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                                {plans.map(plan => (
                                    <div key={plan.id} className={`relative bg-white rounded-2xl p-8 shadow-sm transition-all hover:shadow-xl ${plan.highlight ? 'border-2 border-blue-600 ring-4 ring-blue-50 scale-105 z-10' : 'border border-slate-200'}`}>
                                        {plan.highlight && (
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                Mais Popular
                                            </div>
                                        )}
                                        <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
                                        <div className="my-4">
                                            <span className="text-4xl font-black text-slate-800">{plan.price.split('/')[0]}</span>
                                            <span className="text-slate-400 font-medium text-sm">{plan.price.includes('/') ? '/' + plan.price.split('/')[1] : ''}</span>
                                        </div>
                                        <ul className="space-y-3 mb-8">
                                            {plan.features.map((feat, i) => (
                                                <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                                                    <span className="text-green-500 font-bold">✓</span> {feat}
                                                </li>
                                            ))}
                                        </ul>
                                        <button className={`w-full py-3 rounded-xl font-bold transition-colors ${plan.highlight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                                            Escolher Plano
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'professionals':
                return (
                     <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Encontre Profissionais</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pros.map(pro => (
                                <ProCard key={pro.id} pro={pro} onSelect={(id) => {}} />
                            ))}
                        </div>
                    </div>
                );
            case 'requests-list':
                 return <RequestsListView requests={requests} />;
            case 'create-request':
                return <CreateRequestForm onSubmit={handleCreateRequest} onCancel={() => navigate('home')} />;
            case 'client-dashboard':
                return <ClientDashboard requests={requests} onNavigate={navigate} onViewRequest={(req) => { setSelectedRequest(req); navigate('request-details'); }} />;
            case 'pro-dashboard':
                const currentPro = pros.find(p => p.id === currentProId);
                if (!currentPro) return <div>Erro: Profissional não encontrado</div>;
                return <ProDashboard pro={currentPro} onUpdate={(updates) => handleUpdatePro(currentProId, updates)} />;
            case 'request-details':
                return selectedRequest ? <RequestDetailsView request={selectedRequest} onBack={() => navigate('client-dashboard')} /> : <div>Pedido não encontrado</div>;
            case 'admin-dashboard':
                return <AdminDashboard pros={pros} requests={requests} plans={plans} onUpdatePro={handleUpdatePro} onUpdateRequest={handleUpdateRequest} onUpdatePlan={handleUpdatePlan} />;
            default:
                 return (
                    <div className="flex flex-col items-center justify-center min-h-[50vh]">
                        <h2 className="text-2xl font-bold text-slate-300">Em desenvolvimento</h2>
                        <button onClick={() => navigate('home')} className="mt-4 text-blue-600 font-bold hover:underline">Voltar ao Início</button>
                    </div>
                 );
        }
    };

    return (
        <Layout userRole={userRole} onLogout={() => navigate('logout')} onNavigate={navigate}>
            {renderContent()}
        </Layout>
    );
};

export default App;