
import React from 'react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, userRole, onLogout, onNavigate }) => {
  const getDashboardView = () => {
    if (userRole === 'admin') return 'admin-dashboard';
    if (userRole === 'pro') return 'pro-dashboard';
    return 'client-dashboard';
  };

  const whatsappNumber = "5513991472036";
  const whatsappMessage = encodeURIComponent("Olá! Gostaria de suporte com o Vale Conecta.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen flex flex-col relative">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div 
                className="flex items-center cursor-pointer" 
                onClick={() => onNavigate('home')}
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-2">
                V
              </div>
              <span className="hidden sm:block text-xl font-bold text-slate-800">
                Vale Conecta
              </span>
              {userRole === 'admin' && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase">Admin</span>
              )}
            </div>
            
            <nav className="flex items-center space-x-4">
              <button 
                onClick={() => onNavigate('professionals')}
                className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Profissionais
              </button>

              <button 
                onClick={() => onNavigate('requests-list')}
                className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1"
              >
                Pedidos <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 rounded-full font-bold">Novo</span>
              </button>
              
              {userRole === 'guest' ? (
                <>
                  <button 
                    onClick={() => onNavigate('login')}
                    className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Entrar
                  </button>
                  <button 
                    onClick={() => onNavigate('register')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Cadastrar
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => onNavigate(getDashboardView())}
                    className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Painel
                  </button>
                  <button 
                    onClick={onLogout}
                    className="text-slate-500 hover:text-red-500 text-sm font-medium transition-colors"
                  >
                    Sair
                  </button>
                  <div className={`w-8 h-8 rounded-full border border-slate-300 ${userRole === 'admin' ? 'bg-red-500' : 'bg-slate-200'}`}></div>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      {/* Floating WhatsApp Button */}
      <a 
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[60] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group flex items-center gap-2"
        title="Falar com Suporte"
      >
        <div className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out">
          <span className="whitespace-nowrap font-bold pr-2 pl-1">Suporte</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217s.231.001.332.005c.109.004.258-.041.405.314.159.386.541 1.32.588 1.413.047.094.078.203.016.326-.061.123-.092.203-.184.309-.091.106-.191.235-.273.315-.091.09-.186.188-.08.37.106.182.469.774 1.006 1.252.693.618 1.275.81 1.458.9.183.09.29.076.398-.047.109-.123.463-.538.586-.723.123-.185.246-.154.415-.093.17.061 1.071.505 1.257.597.185.092.308.139.354.216.046.077.046.446-.098.851z"/>
          <path d="M12.036 3c-4.958 0-8.991 4.029-8.991 8.986 0 1.587.413 3.134 1.198 4.493L3 21l4.637-1.217a8.956 8.956 0 0 0 4.399 1.154C17.001 20.937 21 16.908 21 11.951 21 6.996 16.975 3 12.036 3zm0 16.103c-1.41 0-2.793-.365-4.007-1.056l-.288-.165-2.671.701.714-2.611-.181-.288c-.689-1.099-1.054-2.375-1.054-3.701-.001-3.741 3.041-6.784 6.79-6.784 3.748 0 6.788 3.043 6.788 6.784-.002 3.742-3.041 6.791-6.788 6.791z"/>
        </svg>
      </a>

      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">Vale Conecta</h3>
              <p className="text-sm">Formalizando o trabalho e gerando renda na nossa região.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Gestão</h4>
              <ul className="text-sm space-y-2">
                <li className="cursor-pointer hover:text-white" onClick={() => onNavigate('login')}>Acesso Admin</li>
                <li>Portal do Prestador</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contato</h4>
              <p className="text-sm">suporte@valeconecta.com.br</p>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-xs">
            &copy; 2024 Vale Conecta.
          </div>
        </div>
      </footer>
    </div>
  );
};
