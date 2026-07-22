-- SQL Migration for Waiter Calls table
-- Run in Supabase SQL Editor for remote DB support

CREATE TABLE IF NOT EXISTS waiter_calls (
  id BIGSERIAL PRIMARY KEY,
  cafe_id BIGINT REFERENCES cafes(id) ON DELETE CASCADE,
  table_number INT NOT NULL,
  reason TEXT DEFAULT 'General Assistance',
  status TEXT DEFAULT 'pending', -- 'pending', 'acknowledged', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by cafe_id and status
CREATE INDEX IF NOT EXISTS idx_waiter_calls_cafe_status ON waiter_calls(cafe_id, status);

-- Enable RLS
ALTER TABLE waiter_calls ENABLE ROW LEVEL SECURITY;

-- Allow public inserts & reads for cafes
CREATE POLICY "Public read waiter_calls" ON waiter_calls FOR SELECT USING (true);
CREATE POLICY "Public insert waiter_calls" ON waiter_calls FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update waiter_calls" ON waiter_calls FOR UPDATE USING (true);
