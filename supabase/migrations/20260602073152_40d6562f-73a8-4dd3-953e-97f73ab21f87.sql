
-- Seed 16 utilisateurs vérifiés via auth.users (le trigger handle_new_user crée automatiquement le profil + le rôle)
DO $$
DECLARE
  uids uuid[] := ARRAY[
    '11111111-1111-1111-1111-000000000001','11111111-1111-1111-1111-000000000002','11111111-1111-1111-1111-000000000003',
    '11111111-1111-1111-1111-000000000004','11111111-1111-1111-1111-000000000005','11111111-1111-1111-1111-000000000006',
    '22222222-2222-2222-2222-000000000001','22222222-2222-2222-2222-000000000002','22222222-2222-2222-2222-000000000003',
    '22222222-2222-2222-2222-000000000004','22222222-2222-2222-2222-000000000005',
    '33333333-3333-3333-3333-000000000001','33333333-3333-3333-3333-000000000002','33333333-3333-3333-3333-000000000003',
    '44444444-4444-4444-4444-000000000001','44444444-4444-4444-4444-000000000002'
  ];
  names text[] := ARRAY[
    'Aminata Sawadogo','Boubacar Compaoré','Fatoumata Diallo','Ismaël Ouattara','Mariam Traoré','Salif Kaboré',
    'Aïssata Ouédraogo','Kwame Mensah','Awa Sangaré','Tidjane Camara','Nafissatou Bâ',
    'Pierre-Yves Coulibaly','Léa Rasoanaivo','Mehdi Belkacem',
    'Cabinet Yaméogo & Associés','Hub Ouaga 2000'
  ];
  roles text[] := ARRAY[
    'talent','talent','talent','talent','talent','talent',
    'startup','startup','startup','startup','startup',
    'investor','investor','investor',
    'partner','partner'
  ];
  emails text[] := ARRAY[
    'aminata.sawadogo@demo.unions.bf','boubacar.compaore@demo.unions.bf','fatoumata.diallo@demo.unions.bf',
    'ismael.ouattara@demo.unions.bf','mariam.traore@demo.unions.bf','salif.kabore@demo.unions.bf',
    'aissata.ouedraogo@demo.unions.bf','kwame.mensah@demo.unions.bf','awa.sangare@demo.unions.bf',
    'tidjane.camara@demo.unions.bf','nafissatou.ba@demo.unions.bf',
    'py.coulibaly@demo.unions.bf','lea.rasoanaivo@demo.unions.bf','mehdi.belkacem@demo.unions.bf',
    'contact@cabinet-yameogo.demo','contact@hub-ouaga.demo'
  ];
  i int;
BEGIN
  FOR i IN 1..array_length(uids,1) LOOP
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = uids[i]) THEN
      INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
      ) VALUES (
        uids[i], '00000000-0000-0000-0000-000000000000', emails[i],
        crypt('UnionsDemo2026!', gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', names[i], 'role', roles[i]),
        'authenticated','authenticated', now(), now()
      );
    END IF;
  END LOOP;
END $$;
