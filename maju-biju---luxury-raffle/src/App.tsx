/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, ShoppingBag, Store, Ticket, Diamond, User, ArrowRight, QrCode, Lock, ChevronDown, Copy, Check } from 'lucide-react';
import { supabase } from './lib/supabase';

// --- Components ---

// --- Hooks & State Management ---

const useRaffleData = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [raffle, setRaffle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Get first active raffle
      const { data: raffleData } = await supabase
        .from('raffles')
        .select('*')
        .eq('status', 'active')
        .single();
      
      if (raffleData) {
        setRaffle(raffleData);
        // Get tickets for this raffle
        const { data: ticketData } = await supabase
          .from('tickets')
          .select('*')
          .eq('raffle_id', raffleData.id);
        
        if (ticketData) setTickets(ticketData);
      }
      setLoading(false);
    };

    fetchData();

    // Subscribe to ticket changes
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const soldNumbers = tickets.filter(t => t.status === 'sold').map(t => t.number_tag);
  const reservedNumbers = tickets.filter(t => t.status === 'reserved').map(t => t.number_tag);
  const totalNumbers = raffle?.total_numbers || 100;
  const strictlyAvailableCount = totalNumbers - soldNumbers.length - reservedNumbers.length;
  const availablePercentage = (strictlyAvailableCount / totalNumbers) * 100;

  return { raffle, tickets, soldNumbers, reservedNumbers, totalNumbers, strictlyAvailableCount, availablePercentage, loading };
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const menuItems = [
    { to: '/', icon: <Store width={22} />, label: 'BOUTIQUE' },
    { to: '/select-numbers', icon: <Ticket width={22} />, label: 'BILHETES' },
    { to: '/raffle', icon: <Diamond width={22} />, label: 'SORTEIO' },
    { to: '/profile', icon: <User width={22} />, label: 'PERFIL' },
  ];

  return (
    <div className="min-h-screen pb-24 relative">
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-primary border-b border-white/10 shadow-lg">
        <button onClick={() => setIsMenuOpen(true)}>
          <Menu className="text-white cursor-pointer w-6 h-6" />
        </button>
        <div className="text-xl font-serif tracking-[0.2em] text-white uppercase">MAJU BIJU</div>
        <Link to="/select-numbers">
          <ShoppingBag className="text-white cursor-pointer w-6 h-6" />
        </Link>
      </header>

      {/* Side Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-[75%] max-w-[320px] bg-white z-[70] shadow-2xl p-8 flex flex-col"
            >
              <div className="mb-12">
                <div className="text-xl font-serif tracking-[0.2em] text-primary uppercase border-b border-surface-variant pb-4">MAJU BIJU</div>
              </div>

              <div className="flex flex-col gap-8">
                {menuItems.map((item) => (
                  <Link 
                    key={item.to}
                    to={item.to} 
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-4 transition-colors ${
                      location.pathname === item.to || (item.to === '/' && location.pathname === '/raffle')
                        ? 'text-primary font-bold' 
                        : 'text-stone-400'
                    }`}
                  >
                    <div className={location.pathname === item.to ? 'text-primary' : 'text-stone-300'}>
                      {item.icon}
                    </div>
                    <span className="font-serif text-sm tracking-widest uppercase">{item.label}</span>
                  </Link>
                ))}
              </div>

              <div className="mt-auto pt-8 border-t border-surface-variant">
                <p className="text-[10px] text-outline uppercase tracking-[0.2em] mb-2 font-bold">Atendimento</p>
                <a href="https://wa.me/5547996987046" target="_blank" rel="noopener noreferrer" className="text-xs text-secondary font-medium underline">Fale conosco no WhatsApp</a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="pt-16">
        {children}
      </main>

      {/* WhatsApp Button */}
      <a 
        href="https://wa.me/5547996987046" 
        target="_blank" 
        rel="noopener noreferrer"
        className="whatsapp-float fixed right-6 bottom-32 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-lg z-50 active:scale-95 transition-transform"
      >
        <img 
          src="https://lh3.googleusercontent.com/aida/ADBb0ujoeRmjRHnqch48KKP7UVL5EG1dM1B0Hi2rAeS45beXh3V9UimcQ-s8lDIdt3bGWzW4QfO9WsWAP6ReUwk4CWDUa_J9jgmmg6FhhK6IeSLtZc0U5XTD8_Xw6IGpHQi98kVvc9qcprUj6ejVenOOwDR0u2OHTRdReUsSO55mRT2nfmiE67akAG87KuwogANoHwlBZ15bnFuwC3o_RWyI6UJSL92WPOFrwlE-qNot9VrfzWdlPyH6oqRqiTQWlAcLMEa0xXlmnnk8Ew" 
          alt="WhatsApp" 
          className="w-10 h-10 object-contain rounded-full"
        />
      </a>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-3 pb-8 bg-white/95 backdrop-blur-md border-t border-stone-200/60 shadow-luxury">
        <NavItem to="/" icon={<Store width={22} />} label="BOUTIQUE" active={location.pathname === '/' || location.pathname === '/raffle'} />
        <NavItem to="/select-numbers" icon={<Ticket width={22} />} label="BILHETES" active={location.pathname === '/select-numbers'} />
        <NavItem to="/raffle" icon={<Diamond width={22} />} label="SORTEIO" active={location.pathname === '/raffle'} />
        <NavItem to="/profile" icon={<User width={22} style={{ fill: location.pathname === '/profile' ? 'currentColor' : 'none' }} />} label="PERFIL" active={location.pathname === '/profile'} />
      </nav>
    </div>
  );
};

const NavItem = ({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) => (
  <Link to={to} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-primary font-bold' : 'text-stone-400'}`}>
    {icon}
    <span className="font-serif text-[10px] tracking-tight uppercase">{label}</span>
  </Link>
);

// --- Pages ---

const Home = () => {
  const { raffle, strictlyAvailableCount, availablePercentage, loading } = useRaffleData();

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 border-4 border-surface-variant border-t-primary rounded-full"
      />
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="flex flex-col"
    >
    {/* Hero */}
    <section className="relative flex flex-col md:flex-row bg-surface">
      <div className="w-full md:w-1/2 h-[380px] md:h-auto relative overflow-hidden">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFxVQApxqtvxeGb2Gox18bmSlajq2bN4Ptxze9NbP-EeI2VRzddTSOaPnPyJdVZpD6_x3j4iV7zeDsu4B5ev75gn5VDBdh-LrB6KfQMU6JvGZWuOgq01eCBwd5qb-HfHI7alHoNsMSBEUadoXiG8XKxS4O2woW6NYhm5BJKTcoaiDww_QgxrnAG9upzUgUZPVhmn3a2JmvH69cDeAxADFiCOusx1I4pd9kHEEWJ_PxfRMyFx6csR1vurFQftDXZeDTG9fHeLEtugI" 
          alt="Necklace" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 luxury-gradient md:hidden" />
      </div>
      <div className="w-full md:w-1/2 -mt-20 mx-auto max-w-[92%] md:max-w-none md:-mt-0 bg-surface md:bg-transparent px-6 pt-10 pb-10 md:px-16 md:pt-16 flex flex-col relative z-10 shadow-xl md:shadow-none">
        <span className="text-secondary font-semibold text-[10px] tracking-[0.2em] mb-4 uppercase">SORTEIO ESPECIAL</span>
        <h1 className="font-serif text-4xl md:text-5xl mb-6 text-primary">Especial Dia das Mães</h1>
        <p className="text-outline text-lg mb-8 leading-relaxed">
          Perfume árabe <em className="italic">Sabah Al Ward</em>, de fragrância envolvente e marcante. 
          Relógio prata cravejado, que une sofisticação e presença. 
          Par de brincos, pulseira e anel em formato de coração, todos em prata cravejada, com brilho delicado que expressa elegância e significado.
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="p-6 border border-surface-variant bg-white">
            <span className="block text-[10px] text-outline tracking-wider mb-2 uppercase">VALOR DO NÚMERO</span>
            <span className="text-2xl font-serif text-primary">R${raffle?.ticket_price || '15,00'}</span>
          </div>
          <div className="p-6 border border-surface-variant bg-white">
            <span className="block text-[10px] text-outline tracking-wider mb-2 uppercase">ENCERRA EM</span>
            <span className="text-2xl font-serif text-primary">10/05/2026</span>
          </div>
        </div>

        <div className="mb-10">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] text-outline uppercase tracking-wider">números restantes: <span className="font-bold text-primary">{strictlyAvailableCount}</span></span>
            <span className="text-[11px] text-secondary font-bold uppercase tracking-widest">{strictlyAvailableCount}% DISPONÍVEL</span>
          </div>
          <div className="h-[2px] w-full bg-surface-variant">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${availablePercentage}%` }}
              className="h-full bg-secondary" 
            />
          </div>
        </div>

        <Link to="/select-numbers" className="w-full md:w-auto text-center px-12 py-5 bg-primary text-white font-semibold text-sm uppercase tracking-[0.2em] hover:bg-black transition-colors shadow-lg">
          PARTICIPAR AGORA
        </Link>

        {/* Mobile scroll indicator */}
        <div className="flex md:hidden justify-center mt-12 mb-4 animate-bounce opacity-40">
          <ChevronDown className="w-5 h-5 text-primary" />
        </div>
      </div>
    </section>

    {/* Grid */}
    <section className="py-16 px-6 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="text-secondary text-xs tracking-widest mb-2 block uppercase font-semibold">SORTEIO</span>
          <h2 className="font-serif text-3xl text-primary">Itens a ser sorteados</h2>
        </div>
        <a 
          href="https://wa.me/5547996987046" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] text-outline uppercase border-b border-outline hover:text-primary transition-colors pb-1"
        >
          COMPRAR SEPARADAMENTE
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ProductCard 
          img="https://lh3.googleusercontent.com/aida/ADBb0uil8-R6aHAzX6RGAO7V6ylKHnA5iEHW8J9OjNgYDqPqxSohNvb63yZYaCX1WwYzi_pudFAd3TGipbt4OPKhM8C99JEZP8UlHN-VN-ukPX5380Xjn45wo-0RbxdoiAlYli-wscsff_5gRmf1rOtQ1yt2RcgRwA6FPMDj8QLby4vC21qC-eu2Vuma5Ud08Jdm11scsOZoXUdsSTlvmtX2Da8rPPBs0CLJN3UypDLlZw_9-4s_Q51kuPdqhH3Xkxh4RqjaDU4ZHUCf"
          tag="COLEÇÃO AMOR"
          title="Anel Prata Cravejado"
          className="md:col-span-2 md:row-span-2 h-[500px]"
        />
        <ProductCard 
          img="https://lh3.googleusercontent.com/aida/ADBb0uiH2scsjSGGcZygdKVSeBwNT9Sn1htYnMdPpEuZUMoYBO1G3fuZLcz2qR964g7YUfIcbesHr2-nFfOa-ndzJ_YWLvRjXxipLtY9X8KhaS1SB1s1cM__3W-foJ4j1Q5HFvaozmfqbeDk4OQLBrycPMizL3DXH_brusbSuuC_5mIUW9YodUgVIbcmiQOW6ZRQO_Y0t89l4wlECSCNeT1irSHLWngnBzOWalK9iWLnQgZBG1axw3r1xFSuoZhkXLp5gFIUpWtXmPuB4Q"
          tag="REQUINTE"
          title="Pulseira Pingente Coração"
          className="md:col-span-2 md:row-span-1 h-[240px]"
        />
        <ProductCard 
          img="https://lh3.googleusercontent.com/aida/ADBb0ui-4j9S3_QI73ArfQAOOr4x6RYhEPTKkuTaBM5dyxE6PpqBwhfmTDdO1G_6JWsMTPGZG3nKMieIg14xhz6G_QvqWFDd7liE87VD2XvOqkqOsQlOGIArIHadxX3JH1PrQCH1kLE_ZqujMZ9-YI_eNKRO1wCaDHK9cLnaRDScezB73p3JmPMy7KLjosr3AC2ryTbiITfebtjlcFNyk84ETRguHCRTLXlOxRseD1RYowcPO5XCQo1JvXA0Q-Xc4Eo-uJm8wopANnvlQQ"
          title="Relógio Luxo"
          className="h-[240px]"
        />
        <ProductCard 
          img="https://lh3.googleusercontent.com/aida/ADBb0uis3fXS1sORXnvBKXiD2C1FxVCvS_7XlOeH9k9DMYs0RIFW5MOrhJZn0ySwTiDTFQft8YzjjO3JspoEDLOHZnnO5LU_sZzwYdb4ojVBgTSn75JKM8f71QvzeBQQxcqOJwCMMDTeV484ryl7G-5zPthe59u35AvVCQ1l84nzPzzshTXiVsgQ24qu5fCxpVgVLd3Ga6zKmhIhv6M38J2_s0yF0rPHYHONrW1DR9rklDlHYsjn660yMsT3YqlhxHa7Xs8yGjwRKlkslg"
          title="Par de Brincos"
          className="h-[240px]"
        />
      </div>
      <p className="mt-4 text-[10px] text-outline/50 uppercase tracking-widest text-center">Imagem meramente ilustrativa</p>
    </section>
  </motion.div>
  );
};

const ProductCard = ({ img, tag, title, className }: { img: string; tag?: string; title: string; className?: string }) => (
  <div className={`relative group overflow-hidden bg-surface-variant ${className}`}>
    <img 
      src={img} 
      alt={title} 
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
    />
    <div className="absolute inset-0 bg-black/5" />
    <div className="absolute bottom-0 left-0 p-6 w-full bg-gradient-to-t from-primary/80 to-transparent">
      {tag && <p className="text-[10px] text-white/80 tracking-widest mb-1 uppercase font-semibold">{tag}</p>}
      <h4 className="text-white font-serif text-lg">{title}</h4>
    </div>
  </div>
);

const NumberSelection = () => {
  const [selected, setSelected] = useState<number[]>([]);
  const { raffle, soldNumbers, reservedNumbers, totalNumbers, loading } = useRaffleData();
  
  const toggleNumber = (n: number) => {
    if (reservedNumbers.includes(n) || soldNumbers.includes(n)) return;
    setSelected(prev => 
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 border-4 border-surface-variant border-t-primary rounded-full"
      />
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6 max-w-2xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-primary mb-2">Escolha seus Números</h1>
        <p className="text-outline text-sm">Selecione seus números da sorte abaixo. Cada número é uma chance única.</p>
      </div>

      <div className="mb-8 p-6 bg-white border border-surface-variant shadow-sm space-y-6">
        <div>
          <span className="block text-[11px] text-secondary tracking-widest font-bold uppercase mb-4">Números Selecionados</span>
          <div className="flex flex-wrap gap-2">
            {selected.length === 0 ? (
              <span className="text-outline text-sm italic">Nenhum número selecionado</span>
            ) : (
              selected.map(n => (
                <div key={n} className="w-10 h-10 bg-primary text-white flex items-center justify-center font-bold font-serif text-sm animate-in zoom-in-50 duration-300">
                  {n.toString().padStart(3, '0')}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-6 border-t border-surface-variant">
          <span className="text-outline text-sm font-medium">Investimento Total</span>
          <span className="text-3xl font-serif text-primary">R$ {(selected.length * 15).toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-8 text-[10px] font-bold uppercase tracking-widest text-outline">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border border-surface-variant bg-white" /> Disponível</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-secondary" /> Reservado</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-surface-variant" /> Vendido</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-primary" /> Sua Escolha</div>
      </div>

      <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-12">
        {Array.from({ length: totalNumbers }, (_, i) => i + 1).map(n => {
          const isSelected = selected.includes(n);
          const isReserved = reservedNumbers.includes(n);
          const isSold = soldNumbers.includes(n);
          
          return (
            <button
              key={n}
              onClick={() => toggleNumber(n)}
              className={`h-12 border transition-all text-xs font-serif ${
                isSelected ? 'bg-primary border-primary text-white scale-110 shadow-lg z-10' :
                isReserved ? 'bg-secondary/40 border-secondary/30 text-secondary' :
                isSold ? 'bg-surface-variant text-stone-400 border-surface-variant cursor-not-allowed' :
                'bg-white border-surface-variant text-primary hover:border-primary'
              }`}
            >
              {n.toString().padStart(3, '0')}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-24 left-0 w-full p-4 md:static md:p-0 md:bg-transparent"
        >
          <Link 
            to="/checkout"
            state={{ selected }}
            className="w-full flex items-center justify-center gap-3 bg-primary text-white py-5 px-8 font-bold text-sm tracking-[0.2em] uppercase shadow-2xl hover:bg-black transition-colors"
          >
            Confirmar Seleção <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
};

import { useNavigate } from 'react-router-dom';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selected = (location.state as { selected: number[] })?.selected || [];
  const [formData, setFormData] = useState({ name: '', phone: '', birth: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { raffle, loading } = useRaffleData();

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 border-4 border-surface-variant border-t-primary rounded-full"
      />
    </div>
  );

  if (!raffle) return (
    <div className="p-12 text-center text-outline font-serif italic text-lg pt-32">
      Nenhum sorteio ativo encontrado. Por favor, cadastre um sorteio no banco de dados.
    </div>
  );

  const handlePayment = async () => {
    if (!raffle?.id) {
      alert('Sorteio não carregado. Por favor, aguarde ou recarregue a página.');
      return;
    }

    if (!formData.name || !formData.phone) {
      alert('Por favor, preencha nome e telefone.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          raffle_id: raffle.id,
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_birth: formData.birth,
          total_amount: selected.length * (raffle.ticket_price || 15)
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create order items and reserve tickets
      const items = selected.map(num => ({ order_id: order.id, number_tag: num }));
      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) throw itemsError;

      // 3. Mark tickets as sold
      for (const num of selected) {
        const { error: upsertError } = await supabase
          .from('tickets')
          .upsert({ 
            raffle_id: raffle.id,
            number_tag: num,
            status: 'sold', 
            owner_name: formData.name, 
            owner_phone: formData.phone,
            sold_at: new Date().toISOString() 
          }, { onConflict: 'raffle_id,number_tag' });
        
        if (upsertError) throw upsertError;
      }

      navigate('/pix-payment', { state: { selected, total: selected.length * (raffle?.ticket_price || 15) } });
    } catch (error: any) {
      alert('Erro ao processar pedido: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-5xl mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-7 space-y-12">
          <section>
            <h1 className="font-serif text-4xl text-primary mb-2">Checkout Seguro</h1>
            <p className="text-outline text-sm mb-8">Complete sua inscrição para garantir seus números.</p>
            
            <div className="space-y-8">
              <h2 className="text-[10px] font-bold text-outline tracking-[0.2em] uppercase border-b border-surface-variant pb-2">DADOS PESSOAIS</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] text-outline uppercase block mb-1">NOME COMPLETO *</label>
                  <input 
                    type="text" 
                    className="w-full border-b border-surface-variant bg-transparent py-2 focus:border-primary focus:outline-none uppercase text-sm tracking-wide" 
                    placeholder="INSIRA SEU NOME COMPLETO"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] text-outline uppercase block mb-1">WHATSAPP *</label>
                    <input 
                      type="tel" 
                      className="w-full border-b border-surface-variant bg-transparent py-2 focus:border-primary focus:outline-none text-sm" 
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-outline uppercase block mb-1">DATA DE ANIVERSÁRIO (OPCIONAL)</label>
                    <input 
                      type="text" 
                      className="w-full border-b border-surface-variant bg-transparent py-2 focus:border-primary focus:outline-none text-sm" 
                      placeholder="DD / MM / AAAA"
                      value={formData.birth}
                      onChange={e => setFormData({...formData, birth: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <h2 className="text-[10px] font-bold text-outline tracking-[0.2em] uppercase border-b border-surface-variant pb-2">MÉTODO DE PAGAMENTO</h2>
            <div className="p-6 border-2 border-secondary bg-white flex items-center gap-6 relative shadow-sm">
              <div className="bg-secondary/10 p-3 rounded-lg text-secondary">
                <QrCode className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold font-serif text-lg">PIX</p>
                <p className="text-[10px] text-outline uppercase tracking-wider">Confirmação instantânea</p>
              </div>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 border-2 border-secondary rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-secondary rounded-full" />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex justify-between items-end border-b border-surface-variant pb-2">
               <h2 className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">SEUS NÚMEROS SELECIONADOS</h2>
               <Link to="/select-numbers" className="text-[10px] text-secondary underline font-bold uppercase tracking-widest">Editar</Link>
            </div>
            <div className="flex flex-wrap gap-3">
              {selected.slice(0, 5).map(n => (
                <div key={n} className="w-12 h-12 bg-primary text-white flex items-center justify-center font-bold font-serif text-sm shadow-md">
                  {n.toString().padStart(2, '0')}
                </div>
              ))}
              {selected.length > 5 && (
                <div className="w-12 h-12 border border-surface-variant bg-surface-variant/30 flex items-center justify-center text-outline text-xl">...</div>
              )}
            </div>
            <p className="text-[11px] text-outline uppercase tracking-wide italic">{selected.length} bilhetes da sorte selecionados para este sorteio.</p>
          </section>
        </div>

        <div className="md:col-span-5">
          <div className="bg-white p-8 border border-surface-variant shadow-lg sticky top-24 space-y-8">
            <div>
              <h3 className="font-serif text-2xl text-primary mb-1">Resumo do Pedido</h3>
              <p className="text-[10px] text-secondary tracking-widest font-bold uppercase">SORTEIO PREMIUM • REF. 9021</p>
            </div>

            <div className="space-y-4 pt-8 border-t border-surface-variant">
              <div className="flex justify-between text-sm">
                <span className="text-outline font-medium">Bilhetes (x{selected.length})</span>
                <span className="text-primary font-bold">R$ {(selected.length * (raffle?.ticket_price || 15)).toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between items-baseline pt-6 border-t border-surface-variant">
                <span className="font-serif text-lg text-primary">Total</span>
                <div className="text-right">
                  <span className="block font-serif text-4xl text-primary font-bold">R$ {(selected.length * (raffle?.ticket_price || 15)).toFixed(2).replace('.', ',')}</span>
                  <span className="text-[9px] text-outline uppercase tracking-tighter">INCL. TODAS AS TAXAS</span>
                </div>
              </div>

              <button 
                disabled={isSubmitting}
                className="w-full bg-primary text-white py-6 font-bold text-sm tracking-[0.3em] uppercase hover:bg-black transition-all active:scale-[0.98] shadow-2xl disabled:opacity-50"
                onClick={handlePayment}
              >
                {isSubmitting ? 'PROCESSANDO...' : 'FINALIZAR PAGAMENTO'}
              </button>

              <div className="flex items-center justify-center gap-2 text-outline">
                <Lock className="w-3 h-3" />
                <span className="text-[9px] uppercase tracking-[0.15em] font-medium">TRANSAÇÃO SEGURA CRIPTOGRAFADA SSL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PixPayment = () => {
  const location = useLocation();
  const { total } = (location.state as { total: number }) || { total: 0 };
  const [copied, setCopied] = useState(false);
  const pixCode = "00020101021126580014BR.GOV.BCB.PIX01364ba22107-3c60-483d-9c82-e959fd8f36935204000053039865802BR5925Leonardo Baldassarini Dos6009SAO PAULO62080504daqr6304B36A";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 max-w-lg mx-auto text-center space-y-8 py-20"
    >
      <div className="space-y-2">
        <h1 className="font-serif text-3xl text-primary">Quase pronto!</h1>
        <p className="text-stone-500 text-sm">Escaneie o QR Code abaixo ou copie o código PIX para finalizar seu pagamento.</p>
      </div>

      <div className="bg-white p-8 border border-surface-variant shadow-xl inline-block rounded-2xl mx-auto">
        <img 
          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCode)}`} 
          alt="QR Code PIX" 
          className="w-64 h-64 mx-auto mb-4"
        />
        <p className="text-primary font-bold text-lg">Total a pagar: R$ {total.toFixed(2).replace('.', ',')}</p>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] text-outline uppercase font-bold tracking-widest">Código PIX (Copia e Cola)</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-surface-variant/30 p-4 rounded-lg text-left overflow-hidden relative">
            <p className="text-[10px] text-primary break-all font-mono line-clamp-2">{pixCode}</p>
          </div>
          <button 
            onClick={copyToClipboard}
            className="bg-primary text-white p-4 rounded-lg flex items-center justify-center min-w-[60px] active:scale-95 transition-transform"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        {copied && <p className="text-secondary text-xs font-bold animate-in fade-in slide-in-from-top-1">Copiado com sucesso!</p>}
      </div>

      <div className="pt-8 border-t border-surface-variant">
        <p className="text-xs text-stone-400 mb-6">Após o pagamento, envie o comprovante para nosso WhatsApp para agilizar a baixa.</p>
        <Link to="/" className="text-primary font-bold text-sm underline uppercase tracking-widest hover:text-black">
          Voltar para a loja
        </Link>
      </div>
    </motion.div>
  );
};

export default function App() {
  return (
    <Router>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tickets" element={<div className="p-12 text-center text-outline font-serif italic text-lg pt-32">Em breve: Meus Bilhetes</div>} />
            <Route path="/raffle" element={<Home />} />
            <Route path="/profile" element={<div className="p-12 text-center text-outline font-serif italic text-lg pt-32">Em breve: Meu Perfil</div>} />
            <Route path="/select-numbers" element={<NumberSelection />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pix-payment" element={<PixPayment />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </Router>
  );
}
