-- Welloh Trading Simulator - Complete Supabase Schema
-- This schema includes all tables for trading simulation, prediction markets, gamification, and social features

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- ===========================================
-- CORE TABLES
-- ===========================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    league TEXT DEFAULT 'bronze' CHECK (league IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    total_profit_loss DECIMAL(15,2) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Portfolios table
CREATE TABLE portfolios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    initial_balance DECIMAL(15,2) DEFAULT 100000.00,
    current_balance DECIMAL(15,2) DEFAULT 100000.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, name)
);

-- Holdings table
CREATE TABLE holdings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    shares DECIMAL(15,2) NOT NULL,
    average_price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2),
    total_value DECIMAL(15,2) GENERATED ALWAYS AS (shares * current_price) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(portfolio_id, symbol)
);

-- Transactions table
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'short', 'cover')),
    order_type TEXT DEFAULT 'market' CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
    shares DECIMAL(15,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total_value DECIMAL(15,2) GENERATED ALWAYS AS (shares * price) STORED,
    commission DECIMAL(8,2) DEFAULT 0,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Watchlists table
CREATE TABLE watchlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, name)
);

-- Watchlist items table
CREATE TABLE watchlist_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    watchlist_id UUID REFERENCES watchlists(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(watchlist_id, symbol)
);

-- ===========================================
-- PREDICTION MARKETS (Polymarket-like)
-- ===========================================

-- Predictions table
CREATE TABLE predictions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of prediction options
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    settlement_date TIMESTAMP WITH TIME ZONE,
    settlement_value TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
    total_volume DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Bets table
CREATE TABLE bets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    option_index INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    odds DECIMAL(8,4) NOT NULL,
    outcome TEXT CHECK (outcome IN ('win', 'loss', 'pending')),
    payout DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    settled_at TIMESTAMP WITH TIME ZONE
);

-- Prediction orderbook table
CREATE TABLE prediction_orderbook (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    option_index INTEGER NOT NULL,
    order_type TEXT NOT NULL CHECK (order_type IN ('buy', 'sell')),
    price DECIMAL(8,4) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    filled_amount DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'filled', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Prediction chats table
CREATE TABLE prediction_chats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ===========================================
-- GAMIFICATION & LEADERBOARD
-- ===========================================

-- Badges table
CREATE TABLE badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon TEXT,
    category TEXT NOT NULL,
    criteria JSONB NOT NULL, -- Badge earning criteria
    points INTEGER DEFAULT 0,
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User badges table
CREATE TABLE user_badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, badge_id)
);

-- Leaderboard entries table
CREATE TABLE leaderboard_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
    score DECIMAL(10,2) NOT NULL, -- Composite score
    rank INTEGER,
    profit_loss DECIMAL(15,2) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, period)
);

-- Trading streaks table
CREATE TABLE trading_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_win_date DATE,
    last_loss_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

-- ===========================================
-- SOCIAL FEATURES
-- ===========================================

-- Follows table
CREATE TABLE follows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Activities table
CREATE TABLE activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('trade', 'prediction', 'badge', 'follow', 'comment')),
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trading rooms table
CREATE TABLE trading_rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    max_members INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trading room members table
CREATE TABLE trading_room_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES trading_rooms(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(room_id, user_id)
);

-- Trading room messages table
CREATE TABLE trading_room_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES trading_rooms(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'trade_alert')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ===========================================
-- ADMIN & SYSTEM
-- ===========================================

-- System settings table
CREATE TABLE system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Feature flags table
CREATE TABLE feature_flags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Admin logs table
CREATE TABLE admin_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Reports table (user flagging system)
CREATE TABLE reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('user', 'prediction', 'trade', 'message')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- Support tickets table
CREATE TABLE support_tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('general', 'technical', 'billing', 'feature_request', 'bug_report')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_for_user', 'resolved', 'closed')),
    assigned_to UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Ticket messages table
CREATE TABLE ticket_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- For admin-only messages
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- System health table
CREATE TABLE system_health (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'down')),
    response_time_ms INTEGER,
    error_rate DECIMAL(5,2),
    uptime_percentage DECIMAL(5,2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    details JSONB
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Core indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_league ON profiles(league);
CREATE INDEX idx_profiles_level ON profiles(level);
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolios_is_active ON portfolios(is_active);
CREATE INDEX idx_holdings_portfolio_id ON holdings(portfolio_id);
CREATE INDEX idx_holdings_symbol ON holdings(symbol);
CREATE INDEX idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX idx_transactions_executed_at ON transactions(executed_at);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX idx_watchlist_items_watchlist_id ON watchlist_items(watchlist_id);

-- Prediction market indexes
CREATE INDEX idx_predictions_creator_id ON predictions(creator_id);
CREATE INDEX idx_predictions_status ON predictions(status);
CREATE INDEX idx_predictions_end_date ON predictions(end_date);
CREATE INDEX idx_predictions_category ON predictions(category);
CREATE INDEX idx_bets_prediction_id ON bets(prediction_id);
CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bets_outcome ON bets(outcome);
CREATE INDEX idx_prediction_orderbook_prediction_id ON prediction_orderbook(prediction_id);
CREATE INDEX idx_prediction_orderbook_status ON prediction_orderbook(status);
CREATE INDEX idx_prediction_chats_prediction_id ON prediction_chats(prediction_id);

-- Gamification indexes
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX idx_leaderboard_entries_period ON leaderboard_entries(period);
CREATE INDEX idx_leaderboard_entries_score ON leaderboard_entries(score DESC);
CREATE INDEX idx_leaderboard_entries_user_id ON leaderboard_entries(user_id);
CREATE INDEX idx_trading_streaks_user_id ON trading_streaks(user_id);

-- Social indexes
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_trading_room_members_room_id ON trading_room_members(room_id);
CREATE INDEX idx_trading_room_members_user_id ON trading_room_members(user_id);
CREATE INDEX idx_trading_room_messages_room_id ON trading_room_messages(room_id);
CREATE INDEX idx_trading_room_messages_created_at ON trading_room_messages(created_at DESC);

-- Admin indexes
CREATE INDEX idx_system_health_service_name ON system_health(service_name);
CREATE INDEX idx_system_health_recorded_at ON system_health(recorded_at DESC);
CREATE INDEX idx_system_health_status ON system_health(status);
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_target_type ON reports(target_type);
CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- ===========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_holdings_updated_at BEFORE UPDATE ON holdings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_watchlists_updated_at BEFORE UPDATE ON watchlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prediction_orderbook_updated_at BEFORE UPDATE ON prediction_orderbook FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_rooms_updated_at BEFORE UPDATE ON trading_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_orderbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Portfolios policies
CREATE POLICY "Users can view their own portfolios" ON portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own portfolios" ON portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own portfolios" ON portfolios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own portfolios" ON portfolios FOR DELETE USING (auth.uid() = user_id);

-- Holdings policies
CREATE POLICY "Users can view holdings for their portfolios" ON holdings FOR SELECT USING (
    EXISTS (SELECT 1 FROM portfolios WHERE id = holdings.portfolio_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert holdings for their portfolios" ON holdings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM portfolios WHERE id = holdings.portfolio_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update holdings for their portfolios" ON holdings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM portfolios WHERE id = holdings.portfolio_id AND user_id = auth.uid())
);

-- Transactions policies
CREATE POLICY "Users can view transactions for their portfolios" ON transactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM portfolios WHERE id = transactions.portfolio_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert transactions for their portfolios" ON transactions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM portfolios WHERE id = transactions.portfolio_id AND user_id = auth.uid())
);

-- Watchlists policies
CREATE POLICY "Users can view public watchlists and their own private ones" ON watchlists FOR SELECT USING (
    is_public = true OR auth.uid() = user_id
);
CREATE POLICY "Users can create their own watchlists" ON watchlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own watchlists" ON watchlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own watchlists" ON watchlists FOR DELETE USING (auth.uid() = user_id);

-- Watchlist items policies
CREATE POLICY "Users can view items from accessible watchlists" ON watchlist_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM watchlists WHERE id = watchlist_items.watchlist_id AND (is_public = true OR user_id = auth.uid()))
);
CREATE POLICY "Users can manage items in their own watchlists" ON watchlist_items FOR ALL USING (
    EXISTS (SELECT 1 FROM watchlists WHERE id = watchlist_items.watchlist_id AND user_id = auth.uid())
);

-- Predictions policies
CREATE POLICY "Anyone can view predictions" ON predictions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create predictions" ON predictions FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their predictions" ON predictions FOR UPDATE USING (auth.uid() = creator_id);

-- Bets policies
CREATE POLICY "Users can view all bets" ON bets FOR SELECT USING (true);
CREATE POLICY "Users can place their own bets" ON bets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Prediction orderbook policies
CREATE POLICY "Users can view orderbook" ON prediction_orderbook FOR SELECT USING (true);
CREATE POLICY "Users can create their own orders" ON prediction_orderbook FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders" ON prediction_orderbook FOR UPDATE USING (auth.uid() = user_id);

-- Prediction chats policies
CREATE POLICY "Users can view chats for predictions" ON prediction_chats FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post messages" ON prediction_chats FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Badges policies (read-only for users)
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);

-- User badges policies
CREATE POLICY "Users can view all user badges" ON user_badges FOR SELECT USING (true);

-- Leaderboard policies
CREATE POLICY "Anyone can view leaderboard" ON leaderboard_entries FOR SELECT USING (true);

-- Trading streaks policies
CREATE POLICY "Users can view their own streaks" ON trading_streaks FOR SELECT USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Users can view all follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can manage their own follows" ON follows FOR ALL USING (auth.uid() = follower_id);

-- Activities policies
CREATE POLICY "Users can view activities from people they follow and their own" ON activities FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = activities.user_id)
);

-- Trading rooms policies
CREATE POLICY "Anyone can view public rooms" ON trading_rooms FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view rooms they're members of" ON trading_rooms FOR SELECT USING (
    EXISTS (SELECT 1 FROM trading_room_members WHERE room_id = trading_rooms.id AND user_id = auth.uid())
);

-- Trading room members policies
CREATE POLICY "Users can view members of accessible rooms" ON trading_room_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM trading_rooms WHERE id = trading_room_members.room_id AND
        (is_public = true OR EXISTS (SELECT 1 FROM trading_room_members m WHERE m.room_id = trading_rooms.id AND m.user_id = auth.uid())))
);
CREATE POLICY "Users can join public rooms" ON trading_room_members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM trading_rooms WHERE id = trading_room_members.room_id AND is_public = true)
);

-- Trading room messages policies
CREATE POLICY "Users can view messages from accessible rooms" ON trading_room_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM trading_rooms WHERE id = trading_room_messages.room_id AND
        (is_public = true OR EXISTS (SELECT 1 FROM trading_room_members WHERE room_id = trading_rooms.id AND user_id = auth.uid())))
);
CREATE POLICY "Members can post messages in their rooms" ON trading_room_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM trading_room_members WHERE room_id = trading_room_messages.room_id AND user_id = auth.uid())
);

-- System settings policies (admin only)
CREATE POLICY "Admins can manage system settings" ON system_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Feature flags policies (admin only)
CREATE POLICY "Admins can manage feature flags" ON feature_flags FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admin logs policies (admin only)
CREATE POLICY "Admins can view admin logs" ON admin_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can create admin logs" ON admin_logs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Reports policies
CREATE POLICY "Users can view their own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all reports" ON reports FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can update reports" ON reports FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- Support tickets policies
CREATE POLICY "Users can view their own tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all tickets" ON support_tickets FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);
CREATE POLICY "Users can create their own tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update tickets" ON support_tickets FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- Ticket messages policies
CREATE POLICY "Users can view messages for their tickets" ON ticket_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_messages.ticket_id AND user_id = auth.uid()) OR
    is_internal = false OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);
CREATE POLICY "Users can post messages on their tickets" ON ticket_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_messages.ticket_id AND user_id = auth.uid()) AND
    is_internal = false
);
CREATE POLICY "Admins can post internal messages" ON ticket_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- System health policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view system health" ON system_health FOR SELECT USING (auth.uid() IS NOT NULL);

-- ===========================================
-- FUNCTIONS AND TRIGGERS
-- ===========================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate user scoring for leaderboard
CREATE OR REPLACE FUNCTION calculate_user_score(user_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    score DECIMAL(10,2) := 0;
    profit_loss DECIMAL(15,2);
    win_rate DECIMAL(5,2);
    total_trades INTEGER;
    badges_count INTEGER;
    streak_bonus INTEGER;
BEGIN
    -- Get user stats
    SELECT COALESCE(SUM(total_profit_loss), 0), AVG(win_rate), COALESCE(SUM(total_trades), 0)
    INTO profit_loss, win_rate, total_trades
    FROM portfolios
    WHERE user_id = user_uuid AND is_active = true;

    -- Count badges
    SELECT COUNT(*) INTO badges_count
    FROM user_badges
    WHERE user_id = user_uuid;

    -- Get streak bonus
    SELECT current_streak INTO streak_bonus
    FROM trading_streaks
    WHERE user_id = user_uuid;

    -- Calculate composite score
    score := (profit_loss * 0.4) + (win_rate * 100 * 0.3) + (total_trades * 0.1) + (badges_count * 10) + (COALESCE(streak_bonus, 0) * 5);

    RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin KPIs
CREATE OR REPLACE FUNCTION get_admin_kpis()
RETURNS TABLE (
    total_users BIGINT,
    active_users_last_30d BIGINT,
    total_predictions BIGINT,
    active_predictions BIGINT,
    total_bets DECIMAL(15,2),
    support_tickets_open BIGINT,
    system_health_avg DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM profiles) as total_users,
        (SELECT COUNT(*) FROM profiles WHERE updated_at > NOW() - INTERVAL '30 days') as active_users_last_30d,
        (SELECT COUNT(*) FROM predictions) as total_predictions,
        (SELECT COUNT(*) FROM predictions WHERE status = 'active') as active_predictions,
        (SELECT COALESCE(SUM(amount), 0) FROM bets) as total_bets,
        (SELECT COUNT(*) FROM support_tickets WHERE status IN ('open', 'in_progress')) as support_tickets_open,
        (SELECT AVG(CASE WHEN status = 'healthy' THEN 100 WHEN status = 'degraded' THEN 50 ELSE 0 END) FROM system_health WHERE recorded_at > NOW() - INTERVAL '1 hour') as system_health_avg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- INITIAL DATA
-- ===========================================

-- Insert initial badges
INSERT INTO badges (name, description, icon, category, criteria, points, rarity) VALUES
('First Trade', 'Complete your first trade', '🎯', 'trading', '{"total_trades": 1}', 10, 'common'),
('Profit Maker', 'Achieve 10% profit', '💰', 'trading', '{"profit_percentage": 10}', 25, 'uncommon'),
('Consistent Trader', 'Complete 50 trades', '📈', 'trading', '{"total_trades": 50}', 50, 'rare'),
('Prediction Master', 'Win 10 predictions', '🔮', 'predictions', '{"wins": 10}', 40, 'uncommon'),
('Social Butterfly', 'Get 10 followers', '🦋', 'social', '{"followers": 10}', 20, 'common'),
('Streak Champion', 'Maintain a 10-trade win streak', '🔥', 'trading', '{"streak": 10}', 75, 'epic'),
('Diamond League', 'Reach diamond league', '💎', 'achievement', '{"league": "diamond"}', 100, 'legendary');

-- Insert initial system settings
INSERT INTO system_settings (key, value, description) VALUES
('maintenance_mode', 'false', 'Enable maintenance mode'),
('max_portfolios_per_user', '5', 'Maximum portfolios per user'),
('commission_rate', '0.01', 'Trading commission rate (1%)'),
('prediction_fee', '0.02', 'Prediction market fee (2%)'),
('support_email', '"support@welloh.com"', 'Support email address');

-- Insert initial feature flags
INSERT INTO feature_flags (name, description, enabled, rollout_percentage) VALUES
('prediction_markets', 'Enable prediction markets feature', true, 100),
('social_features', 'Enable social features', true, 100),
('leaderboard', 'Enable leaderboard', true, 100),
('trading_streaks', 'Enable trading streaks tracking', true, 100),
('support_tickets', 'Enable support ticket system', true, 100),
('real_time_updates', 'Enable real-time updates', false, 0);

-- Insert initial trading rooms
INSERT INTO trading_rooms (name, description, creator_id, is_public, max_members) VALUES
('General Discussion', 'General trading discussion', '00000000-0000-0000-0000-000000000000', true, 500),
('Day Traders', 'Fast-paced day trading', '00000000-0000-0000-0000-000000000000', true, 200),
('Long Term Investors', 'Long-term investment strategies', '00000000-0000-0000-0000-000000000000', true, 300),
('Crypto Corner', 'Cryptocurrency trading', '00000000-0000-0000-0000-000000000000', true, 250),
('Options Traders', 'Options trading strategies', '00000000-0000-0000-0000-000000000000', true, 150);