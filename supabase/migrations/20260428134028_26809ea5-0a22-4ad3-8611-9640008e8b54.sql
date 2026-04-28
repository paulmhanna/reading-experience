
CREATE TABLE public.analytics_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric text NOT NULL CHECK (metric IN ('entered','finished')),
  session_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (metric, session_id)
);

ALTER TABLE public.analytics_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read counters"
ON public.analytics_counters FOR SELECT
USING (true);

CREATE POLICY "anyone can insert counter event"
ON public.analytics_counters FOR INSERT
WITH CHECK (metric IN ('entered','finished') AND length(session_id) BETWEEN 4 AND 80);

CREATE INDEX idx_analytics_counters_metric ON public.analytics_counters(metric);
