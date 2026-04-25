-- Migrations para o sistema de sorteios Maju Biju (Idempotente)

-- 1. Tabela de Sorteios (Raffles)
CREATE TABLE IF NOT EXISTS raffles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  ticket_price DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  total_numbers INTEGER NOT NULL DEFAULT 100,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'finished', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ
);

-- 2. Tabela de Números (Tickets)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raffle_id UUID REFERENCES raffles(id) ON DELETE CASCADE,
  number_tag INTEGER NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
  owner_name TEXT,
  owner_phone TEXT,
  reserved_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  UNIQUE(raffle_id, number_tag)
);

-- 3. Tabela de Pedidos (Orders)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raffle_id UUID REFERENCES raffles(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_birth TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'expired')),
  payment_method TEXT DEFAULT 'pix',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Relacionamento Pedido x Números
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  number_tag INTEGER NOT NULL
);

-- RLS (Row Level Security)
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Políticas (Usando bloco DO para evitar erro de duplicata se rodar de novo)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read on raffles') THEN
        CREATE POLICY "Allow public read on raffles" ON raffles FOR SELECT TO anon USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read on tickets') THEN
        CREATE POLICY "Allow public read on tickets" ON tickets FOR SELECT TO anon USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert on orders') THEN
        CREATE POLICY "Allow public insert on orders" ON orders FOR INSERT TO anon WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert on order_items') THEN
        CREATE POLICY "Allow public insert on order_items" ON order_items FOR INSERT TO anon WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public update on tickets') THEN
        CREATE POLICY "Allow public update on tickets" ON tickets FOR UPDATE TO anon USING (status = 'available') WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert on tickets') THEN
        CREATE POLICY "Allow public insert on tickets" ON tickets FOR INSERT TO anon WITH CHECK (true);
    END IF;
END $$;
