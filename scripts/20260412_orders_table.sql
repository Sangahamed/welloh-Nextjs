-- Migration: 20260412_orders_table.sql
-- Description: Adding the orders table and its enums manually because drizzle-kit push failed.

-- 1. Create ENUM Types (Use IF NOT EXISTS wrappers if necessary or DO blocks)
DO $$ BEGIN
    CREATE TYPE order_type AS ENUM ('MARKET', 'LIMIT', 'STOP_LOSS', 'TAKE_PROFIT', 'OCO', 'TRAILING_STOP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_side AS ENUM ('BUY', 'SELL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('PENDING', 'FILLED', 'CANCELLED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create the "orders" table
CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    ticker text NOT NULL,
    exchange text NOT NULL,
    type order_type NOT NULL,
    side order_side NOT NULL,
    shares numeric(15, 4) NOT NULL,
    price numeric(15, 4),
    stop_price numeric(15, 4),
    status order_status NOT NULL DEFAULT 'PENDING',
    filled_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 4. Add Policy (Optional but recommended for frontend access)
-- Assuming portfolio can be linked back to user, but usually orders should be queried per user context.
-- If the portfolio table RLS protects the orders through a join, or we allow the user directly.
-- Drizzle queries bypass RLS for API endpoints if using a service key or direct connection pool.
