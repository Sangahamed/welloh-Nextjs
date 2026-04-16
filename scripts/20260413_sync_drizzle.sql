-- Migration auto-générée pour synchroniser la base avec les schémas Drizzle
-- Date: 2026-04-13
-- Usage: exécuter dans Supabase SQL Editor ou psql

-- Utilitaire: crée un type enum si nécessaire (exemple pour order_type/order_side/order_status)
DO $$ BEGIN
    CREATE TYPE IF NOT EXISTS order_type AS ENUM ('MARKET','LIMIT','STOP_LOSS','TAKE_PROFIT','OCO','TRAILING_STOP');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
    CREATE TYPE IF NOT EXISTS order_side AS ENUM ('BUY','SELL');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
    CREATE TYPE IF NOT EXISTS order_status AS ENUM ('PENDING','FILLED','CANCELLED','FAILED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- PROFILES (users in Drizzle)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS league TEXT DEFAULT 'bronze';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_points INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_profit_loss NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_trades INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS win_rate NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- PORTFOLIOS
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS initial_balance NUMERIC(15,4) DEFAULT 100000;
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS current_balance NUMERIC(15,4) DEFAULT 100000;
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());
CREATE INDEX IF NOT EXISTS idx_portfolios_user ON public.portfolios(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolios_user_name ON public.portfolios(user_id, name);

-- HOLDINGS
CREATE TABLE IF NOT EXISTS public.holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.holdings ADD COLUMN IF NOT EXISTS portfolio_id UUID;
ALTER TABLE public.holdings ADD COLUMN IF NOT EXISTS ticker TEXT;
ALTER TABLE public.holdings ADD COLUMN IF NOT EXISTS exchange TEXT;
ALTER TABLE public.holdings ADD COLUMN IF NOT EXISTS shares NUMERIC(15,4) DEFAULT 0;
ALTER TABLE public.holdings ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(15,4);
ALTER TABLE public.holdings ADD COLUMN IF NOT EXISTS current_price NUMERIC(15,4);
ALTER TABLE public.holdings ADD COLUMN IF NOT EXISTS total_value NUMERIC(15,4);
ALTER TABLE public.holdings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());
ALTER TABLE public.holdings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());
CREATE UNIQUE INDEX IF NOT EXISTS idx_holdings_portfolio_symbol ON public.holdings(portfolio_id, ticker, exchange);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS portfolio_id UUID;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS ticker TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS exchange TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS shares NUMERIC(15,4);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS price NUMERIC(15,4);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS fees NUMERIC(15,4) DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT timezone('utc', now());
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_id ON public.transactions(portfolio_id);

-- WATCHLISTS
CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.watchlists ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.watchlists ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'default';
ALTER TABLE public.watchlists ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.watchlists ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE public.watchlists ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());
ALTER TABLE public.watchlists ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());
CREATE INDEX IF NOT EXISTS idx_watchlists_user ON public.watchlists(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_watchlists_user_name ON public.watchlists(user_id, name);

-- WATCHLIST_ITEMS
CREATE TABLE IF NOT EXISTS public.watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.watchlist_items ADD COLUMN IF NOT EXISTS watchlist_id UUID;
ALTER TABLE public.watchlist_items ADD COLUMN IF NOT EXISTS symbol TEXT;
ALTER TABLE public.watchlist_items ADD COLUMN IF NOT EXISTS exchange TEXT;
ALTER TABLE public.watchlist_items ADD COLUMN IF NOT EXISTS added_at TIMESTAMPTZ DEFAULT timezone('utc', now());
CREATE UNIQUE INDEX IF NOT EXISTS idx_watchlist_items_unique ON public.watchlist_items(watchlist_id, symbol);

-- ANALYSIS HISTORIES (analyses)
CREATE TABLE IF NOT EXISTS public.analysis_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.analysis_histories ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.analysis_histories ADD COLUMN IF NOT EXISTS company_identifier TEXT;
ALTER TABLE public.analysis_histories ADD COLUMN IF NOT EXISTS comparison_identifier TEXT;
ALTER TABLE public.analysis_histories ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE public.analysis_histories ADD COLUMN IF NOT EXISTS analysis_data JSONB DEFAULT '{}';
ALTER TABLE public.analysis_histories ADD COLUMN IF NOT EXISTS news_data JSONB DEFAULT '[]';
ALTER TABLE public.analysis_histories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());

-- ORDERS (enum types created above)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS portfolio_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ticker TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS exchange TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS type order_type;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS side order_side;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shares NUMERIC(15,4);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS price NUMERIC(15,4);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stop_price NUMERIC(15,4);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status order_status DEFAULT 'PENDING';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS filled_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());

-- PREDICTIONS
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS creator_id UUID;
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS options JSONB;
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ;
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS total_volume NUMERIC(15,4) DEFAULT 0;
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());

-- BETS
CREATE TABLE IF NOT EXISTS public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS prediction_id UUID;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS option_id TEXT;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS tokens NUMERIC(15,4);
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS price_per_token NUMERIC(10,4);
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS total_cost NUMERIC(15,4);
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());

-- PREDICTION ORDERBOOK
CREATE TABLE IF NOT EXISTS public.prediction_orderbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.prediction_orderbook ADD COLUMN IF NOT EXISTS prediction_id UUID;
ALTER TABLE public.prediction_orderbook ADD COLUMN IF NOT EXISTS option_id TEXT;
ALTER TABLE public.prediction_orderbook ADD COLUMN IF NOT EXISTS side TEXT;
ALTER TABLE public.prediction_orderbook ADD COLUMN IF NOT EXISTS price NUMERIC(10,4);
ALTER TABLE public.prediction_orderbook ADD COLUMN IF NOT EXISTS quantity NUMERIC(15,4);
ALTER TABLE public.prediction_orderbook ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.prediction_orderbook ADD COLUMN IF NOT EXISTS is_filled BOOLEAN DEFAULT false;
ALTER TABLE public.prediction_orderbook ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());
ALTER TABLE public.prediction_orderbook ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());

-- PREDICTION_CHATS
CREATE TABLE IF NOT EXISTS public.prediction_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.prediction_chats ADD COLUMN IF NOT EXISTS prediction_id UUID;
ALTER TABLE public.prediction_chats ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.prediction_chats ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.prediction_chats ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());

-- SOCIAL: FOLLOWING
CREATE TABLE IF NOT EXISTS public.following (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.following ADD COLUMN IF NOT EXISTS follower_id UUID;
ALTER TABLE public.following ADD COLUMN IF NOT EXISTS following_id UUID;
ALTER TABLE public.following ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());
CREATE UNIQUE INDEX IF NOT EXISTS idx_following_unique ON public.following(follower_id, following_id);

-- ACTIVITIES
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS activity_type TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS target_type TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS target_id UUID;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());

-- TRADING ROOMS
CREATE TABLE IF NOT EXISTS public.trading_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.trading_rooms ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.trading_rooms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.trading_rooms ADD COLUMN IF NOT EXISTS focus TEXT;
ALTER TABLE public.trading_rooms ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE public.trading_rooms ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 100;
ALTER TABLE public.trading_rooms ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.trading_rooms ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());
ALTER TABLE public.trading_rooms ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());

-- TRADING ROOM MEMBERS
CREATE TABLE IF NOT EXISTS public.trading_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.trading_room_members ADD COLUMN IF NOT EXISTS room_id UUID;
ALTER TABLE public.trading_room_members ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.trading_room_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
ALTER TABLE public.trading_room_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT timezone('utc', now());
CREATE UNIQUE INDEX IF NOT EXISTS idx_trading_room_members_unique ON public.trading_room_members(room_id, user_id);

-- TRADING ROOM MESSAGES
CREATE TABLE IF NOT EXISTS public.trading_room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.trading_room_messages ADD COLUMN IF NOT EXISTS room_id UUID;
ALTER TABLE public.trading_room_messages ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.trading_room_messages ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.trading_room_messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE public.trading_room_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());

-- GAMIFICATION: BADGES
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS criteria JSONB;
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'common';
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());

-- USER BADGES
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.user_badges ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.user_badges ADD COLUMN IF NOT EXISTS badge_id UUID;
ALTER TABLE public.user_badges ADD COLUMN IF NOT EXISTS earned_at TIMESTAMPTZ DEFAULT timezone('utc', now());
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_badges_unique ON public.user_badges(user_id, badge_id);

-- LEADERBOARD ENTRIES
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.leaderboard_entries ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.leaderboard_entries ADD COLUMN IF NOT EXISTS period TEXT DEFAULT 'all_time';
ALTER TABLE public.leaderboard_entries ADD COLUMN IF NOT EXISTS pnl_score NUMERIC(10,4) DEFAULT 0;
ALTER TABLE public.leaderboard_entries ADD COLUMN IF NOT EXISTS composite_score NUMERIC(10,4) DEFAULT 0;
ALTER TABLE public.leaderboard_entries ADD COLUMN IF NOT EXISTS total_trades INTEGER DEFAULT 0;
ALTER TABLE public.leaderboard_entries ADD COLUMN IF NOT EXISTS rank INTEGER;
ALTER TABLE public.leaderboard_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_user_period ON public.leaderboard_entries(user_id, period);

-- TRADING STREAKS
CREATE TABLE IF NOT EXISTS public.trading_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.trading_streaks ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.trading_streaks ADD COLUMN IF NOT EXISTS streak_type TEXT;
ALTER TABLE public.trading_streaks ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE public.trading_streaks ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
ALTER TABLE public.trading_streaks ADD COLUMN IF NOT EXISTS last_activity_date DATE;
ALTER TABLE public.trading_streaks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());
CREATE UNIQUE INDEX IF NOT EXISTS idx_trading_streaks_unique ON public.trading_streaks(user_id, streak_type);

-- CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());

-- ADMIN & SYSTEM
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY
);
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS value JSONB;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT false;
ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.admin_logs ADD COLUMN IF NOT EXISTS admin_id UUID;
ALTER TABLE public.admin_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE public.admin_logs ADD COLUMN IF NOT EXISTS target_type TEXT;
ALTER TABLE public.admin_logs ADD COLUMN IF NOT EXISTS target_id UUID;
ALTER TABLE public.admin_logs ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.admin_logs ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE public.admin_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS reporter_id UUID;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS target_type TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS target_id UUID;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.ticket_messages ADD COLUMN IF NOT EXISTS ticket_id UUID;
ALTER TABLE public.ticket_messages ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.ticket_messages ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.ticket_messages ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT false;
ALTER TABLE public.ticket_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.system_health ADD COLUMN IF NOT EXISTS service_name TEXT;
ALTER TABLE public.system_health ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.system_health ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;
ALTER TABLE public.system_health ADD COLUMN IF NOT EXISTS error_rate NUMERIC(10,6);
ALTER TABLE public.system_health ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ DEFAULT timezone('utc', now());
ALTER TABLE public.system_health ADD COLUMN IF NOT EXISTS details JSONB;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_portfolios_is_active ON public.portfolios(is_active);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON public.holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_executed_at ON public.transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_watchlist_id ON public.watchlist_items(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_predictions_creator_id ON public.predictions(creator_id);
CREATE INDEX IF NOT EXISTS idx_bets_prediction_id ON public.bets(prediction_id);
CREATE INDEX IF NOT EXISTS idx_trading_room_members_room ON public.trading_room_members(room_id);

-- End of sync migration
