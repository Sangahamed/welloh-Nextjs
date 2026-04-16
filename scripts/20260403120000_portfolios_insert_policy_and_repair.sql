-- Permet aux utilisateurs authentifiés d'insérer leur propre portefeuille (réparation client / ensureUserProfileAndPortfolio).
-- Sans cette politique, seul le trigger SECURITY DEFINER peut insérer dans portfolios.

DROP POLICY IF EXISTS "Users can insert their own portfolio." ON public.portfolios;
CREATE POLICY "Users can insert their own portfolio."
  ON public.portfolios FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Réparation one-shot : utilisateurs auth sans profil ou sans portefeuille (ex. comptes créés avant le trigger).
-- À exécuter dans le SQL Editor Supabase si besoin.

INSERT INTO public.profiles (id, full_name, role)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'Utilisateur Welloh'),
       'user'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.portfolios (user_id)
SELECT u.id
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.portfolios po WHERE po.user_id = u.id);

INSERT INTO public.watchlists (user_id)
SELECT p.id
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.watchlists w WHERE w.user_id = p.id)
ON CONFLICT (user_id) DO NOTHING;
