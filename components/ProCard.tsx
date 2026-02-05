
import React from 'react';
import { Professional, SubscriptionPlan, ReputationLevel } from '../types';

interface ProCardProps {
  pro: Professional;
  onSelect: (id: string) => void;
  rank?: number;
}

export const ProCard: React.FC<ProCardProps> = ({ pro, onSelect, rank }) => {
  const isPremium = pro.plan === SubscriptionPlan.PREMIUM;
  const isPlus = pro.plan === SubscriptionPlan.PLUS;

  // Lógica de Reputação (Duplicada aqui para isolamento do componente visual)
  const getReputationLevel = (p: Professional): { level: ReputationLevel, color: string, icon: string } => {
    if (p.reviewCount >= 100 && p.rating >= 4.9) return { level: 'Diamante', color: 'bg-cyan-500', icon: '💎' };
    if (p.reviewCount >= 50 && p.rating >= 4.8) return { level: 'Ouro', color: 'bg-yellow-400', icon: '🏆' };
    if (p.reviewCount >= 30 && p.rating >= 4.5) return { level: 'Prata', color: 'bg-slate-400', icon: '🥈' };
    if (p.reviewCount >= 10 && p.rating >= 4.0) return { level: 'Bronze', color: 'bg-amber-700', icon: '🥉' };
    return { level: 'Novato', color: 'bg-slate-500', icon: '🛡️' };
  };

  const reputation = getReputationLevel(pro);

  return (
    <div 
      className={`bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border-2 ${
        isPremium ? 'border-amber-400' : isPlus ? 'border-blue-300' : 'border-transparent'
      } cursor-pointer group relative`}
      onClick={() => onSelect(pro.id)}
    >
      <div className="relative h-48">
        <img 
          src={pro.photo} 
          alt={pro.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badge de Ranking Numérico */}
        {rank && (
            <div className={`absolute top-0 right-0 m-3 px-3 py-1 rounded-full shadow-lg z-10 font-black text-xs flex items-center gap-1 ${
                rank === 1 ? 'bg-yellow-400 text-yellow-900 border-2 border-white' :
                rank === 2 ? 'bg-slate-300 text-slate-800 border-2 border-white' :
                rank === 3 ? 'bg-amber-700 text-amber-100 border-2 border-white' :
                'bg-slate-900/80 text-white backdrop-blur-sm'
            }`}>
                {rank <= 3 && <span>🏆</span>}
                <span>#{rank}</span>
            </div>
        )}

        {/* Badge de Reputação */}
        <div className={`absolute -bottom-3 right-4 ${reputation.color} text-white px-3 py-1 rounded-lg shadow-md flex items-center gap-1 z-10 border-2 border-white`}>
            <span className="text-sm">{reputation.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-wide">{reputation.level}</span>
        </div>

        {pro.verified && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center shadow-sm border border-green-100">
            <span className="text-green-600 text-[10px] font-bold uppercase tracking-wider">✓ Verificado</span>
          </div>
        )}
      </div>
      
      <div className="p-5 pt-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-slate-800 leading-tight">{pro.name}</h3>
          <div className="flex items-center bg-slate-100 px-2 py-0.5 rounded text-sm font-semibold text-slate-700">
            <span className="text-amber-400 mr-1">★</span> {pro.rating}
          </div>
        </div>
        
        <p className="text-xs text-slate-500 mb-4 line-clamp-2">{pro.description}</p>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {pro.services.slice(0, 2).map(s => (
            <span key={s} className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase">
              {s}
            </span>
          ))}
          {pro.services.length > 2 && <span className="text-[10px] text-slate-400 font-medium">+{pro.services.length - 2}</span>}
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
          <div className="text-slate-400 text-xs font-medium">
            📍 {pro.cities.join(', ')}
          </div>
          <div className="text-blue-600 font-bold">
            R$ {pro.basePrice}<span className="text-[10px] text-slate-400 font-normal">/visita</span>
          </div>
        </div>
      </div>
    </div>
  );
};
