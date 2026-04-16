-- =====================================================
-- Migration: Trading Rooms + Feature Flags
-- Run this in Supabase SQL Editor
-- =====================================================

-- Trading Rooms Tables
CREATE TABLE IF NOT EXISTS trading_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_name TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT false,
  max_members INTEGER NOT NULL DEFAULT 50,
  members_count INTEGER NOT NULL DEFAULT 0,
  focus TEXT NOT NULL DEFAULT 'mixed' CHECK (focus IN ('stocks', 'crypto', 'forex', 'commodities', 'mixed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trading_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES trading_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS trading_room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES trading_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'chat' CHECK (message_type IN ('chat', 'trade', 'alert', 'analysis')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trading_room_members_room ON trading_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_trading_room_members_user ON trading_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_room_messages_room ON trading_room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_trading_room_messages_ts ON trading_room_messages(timestamp);

-- Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL DEFAULT 'trading' CHECK (category IN ('trading', 'social', 'admin', 'ui', 'experimental')),
  rollout_percentage INTEGER NOT NULL DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON feature_flags(category);

-- Row Level Security
ALTER TABLE trading_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Trading Rooms policies
CREATE POLICY "Public rooms are viewable by all authenticated users"
  ON trading_rooms FOR SELECT TO authenticated
  USING (is_private = false OR id IN (SELECT room_id FROM trading_room_members WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can create rooms"
  ON trading_rooms FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Room owners can update their rooms"
  ON trading_rooms FOR UPDATE TO authenticated
  USING (creator_id = auth.uid());

-- Members policies
CREATE POLICY "Members are viewable by room participants"
  ON trading_room_members FOR SELECT TO authenticated
  USING (room_id IN (SELECT room_id FROM trading_room_members WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can join rooms"
  ON trading_room_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can leave rooms"
  ON trading_room_members FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Messages viewable by room members"
  ON trading_room_messages FOR SELECT TO authenticated
  USING (room_id IN (SELECT room_id FROM trading_room_members WHERE user_id = auth.uid()));

CREATE POLICY "Room members can send messages"
  ON trading_room_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND room_id IN (SELECT room_id FROM trading_room_members WHERE user_id = auth.uid())
  );

-- Feature Flags policies
CREATE POLICY "Feature flags readable by all authenticated"
  ON feature_flags FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage feature flags"
  ON feature_flags FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Enable Realtime for trading room messages
ALTER PUBLICATION supabase_realtime ADD TABLE trading_room_messages;
