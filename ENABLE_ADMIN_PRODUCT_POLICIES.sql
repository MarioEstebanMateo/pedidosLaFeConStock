-- Permite que el panel actual gestione productos mediante la clave anon de Supabase.
-- Ejecutar una sola vez en Supabase > SQL Editor.
--
-- Importante: el panel usa una autenticacion propia basada en admin_centro, no
-- Supabase Auth. Por eso PostgreSQL recibe estas peticiones como rol anon y no
-- puede distinguirlas de una visita publica. Para una seguridad mas estricta,
-- migrar el login a Supabase Auth y cambiar las politicas a authenticated.

DO $$
DECLARE
  product_table text;
BEGIN
  FOREACH product_table IN ARRAY ARRAY[
    'helados_centro', 'helados_caba',
    'palitos_centro', 'palitos_caba',
    'postres_centro', 'postres_caba',
    'crocker_centro', 'crocker_caba',
    'dieteticos_centro', 'dieteticos_caba',
    'buffet_centro', 'buffet_caba',
    'softs_centro', 'softs_caba',
    'dulces_centro', 'dulces_caba',
    'paletas_centro', 'paletas_caba',
    'bites_centro', 'bites_caba',
    'barritas_centro', 'barritas_caba',
    'termicos_centro', 'termicos_caba'
  ]
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO anon', product_table);
    EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon');
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', product_table);

    EXECUTE format('DROP POLICY IF EXISTS "anon_select_products" ON public.%I', product_table);
    EXECUTE format('DROP POLICY IF EXISTS "anon_insert_products" ON public.%I', product_table);
    EXECUTE format('DROP POLICY IF EXISTS "anon_update_products" ON public.%I', product_table);
    EXECUTE format('DROP POLICY IF EXISTS "anon_delete_products" ON public.%I', product_table);

    EXECUTE format('CREATE POLICY "anon_select_products" ON public.%I FOR SELECT TO anon USING (true)', product_table);
    EXECUTE format('CREATE POLICY "anon_insert_products" ON public.%I FOR INSERT TO anon WITH CHECK (true)', product_table);
    EXECUTE format('CREATE POLICY "anon_update_products" ON public.%I FOR UPDATE TO anon USING (true) WITH CHECK (true)', product_table);
    EXECUTE format('CREATE POLICY "anon_delete_products" ON public.%I FOR DELETE TO anon USING (true)', product_table);
  END LOOP;
END $$;

-- Verificacion opcional:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public' AND tablename LIKE '%\_centro' OR tablename LIKE '%\_caba';
