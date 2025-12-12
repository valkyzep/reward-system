-- Quick insert for 4 main rewards with all variants and galleries

-- Gaming Mouse
WITH new_reward AS (
  INSERT INTO rewards (name, points, category, quantity, variant_type) 
  VALUES ('Gaming Mouse', 150, 'Gadget', 5, 'color')
  RETURNING id
),
variants AS (
  INSERT INTO reward_variants (reward_id, option_name)
  SELECT id, unnest(ARRAY['Black', 'White', 'Red']) FROM new_reward
  RETURNING id, option_name
)
INSERT INTO reward_galleries (variant_id, image_url, image_order)
SELECT v.id, img.url, img.ord
FROM variants v
CROSS JOIN LATERAL (
  SELECT * FROM (
    VALUES 
      ('Black', 'https://placehold.co/400x300/000000/FFFFFF?text=Black+Mouse+1', 0),
      ('Black', 'https://placehold.co/400x300/1a1a1a/FFFFFF?text=Black+Mouse+2', 1),
      ('Black', 'https://placehold.co/400x300/0d0d0d/FFFFFF?text=Black+Mouse+3', 2),
      ('Black', 'https://placehold.co/400x300/262626/FFFFFF?text=Black+Mouse+4', 3),
      ('White', 'https://placehold.co/400x300/FFFFFF/000000?text=White+Mouse+1', 0),
      ('White', 'https://placehold.co/400x300/f5f5f5/000000?text=White+Mouse+2', 1),
      ('White', 'https://placehold.co/400x300/e8e8e8/000000?text=White+Mouse+3', 2),
      ('White', 'https://placehold.co/400x300/fafafa/000000?text=White+Mouse+4', 3),
      ('Red', 'https://placehold.co/400x300/FF0000/FFFFFF?text=Red+Mouse+1', 0),
      ('Red', 'https://placehold.co/400x300/cc0000/FFFFFF?text=Red+Mouse+2', 1),
      ('Red', 'https://placehold.co/400x300/e60000/FFFFFF?text=Red+Mouse+3', 2),
      ('Red', 'https://placehold.co/400x300/ff3333/FFFFFF?text=Red+Mouse+4', 3)
  ) AS t(variant, url, ord)
) img
WHERE v.option_name = img.variant;

-- GCash
WITH new_reward AS (
  INSERT INTO rewards (name, points, category, quantity, variant_type) 
  VALUES ('GCash', 1000, 'E-wallet', 100, 'denomination')
  RETURNING id
),
variants AS (
  INSERT INTO reward_variants (reward_id, option_name)
  SELECT id, unnest(ARRAY['1k', '5k', '10k', '25k', '50k']) FROM new_reward
  RETURNING id, option_name
)
INSERT INTO reward_galleries (variant_id, image_url, image_order)
SELECT v.id, img.url, img.ord
FROM variants v
CROSS JOIN LATERAL (
  SELECT * FROM (
    VALUES 
      ('1k', 'https://placehold.co/400x300/00B0FF/FFFFFF?text=1k+Pesos+1', 0),
      ('1k', 'https://placehold.co/400x300/0099CC/FFFFFF?text=1k+Pesos+2', 1),
      ('1k', 'https://placehold.co/400x300/0088BB/FFFFFF?text=1k+Pesos+3', 2),
      ('1k', 'https://placehold.co/400x300/00AADD/FFFFFF?text=1k+Pesos+4', 3),
      ('5k', 'https://placehold.co/400x300/FF6B00/FFFFFF?text=5k+Pesos+1', 0),
      ('5k', 'https://placehold.co/400x300/FF5500/FFFFFF?text=5k+Pesos+2', 1),
      ('5k', 'https://placehold.co/400x300/FF7722/FFFFFF?text=5k+Pesos+3', 2),
      ('5k', 'https://placehold.co/400x300/FF8833/FFFFFF?text=5k+Pesos+4', 3),
      ('10k', 'https://placehold.co/400x300/00C853/FFFFFF?text=10k+Pesos+1', 0),
      ('10k', 'https://placehold.co/400x300/00B347/FFFFFF?text=10k+Pesos+2', 1),
      ('10k', 'https://placehold.co/400x300/00D95F/FFFFFF?text=10k+Pesos+3', 2),
      ('10k', 'https://placehold.co/400x300/00E066/FFFFFF?text=10k+Pesos+4', 3),
      ('25k', 'https://placehold.co/400x300/9C27B0/FFFFFF?text=25k+Pesos+1', 0),
      ('25k', 'https://placehold.co/400x300/8E24AA/FFFFFF?text=25k+Pesos+2', 1),
      ('25k', 'https://placehold.co/400x300/7B1FA2/FFFFFF?text=25k+Pesos+3', 2),
      ('25k', 'https://placehold.co/400x300/AB47BC/FFFFFF?text=25k+Pesos+4', 3),
      ('50k', 'https://placehold.co/400x300/F44336/FFFFFF?text=50k+Pesos+1', 0),
      ('50k', 'https://placehold.co/400x300/E53935/FFFFFF?text=50k+Pesos+2', 1),
      ('50k', 'https://placehold.co/400x300/D32F2F/FFFFFF?text=50k+Pesos+3', 2),
      ('50k', 'https://placehold.co/400x300/EF5350/FFFFFF?text=50k+Pesos+4', 3)
  ) AS t(variant, url, ord)
) img
WHERE v.option_name = img.variant;

-- BMW M2 2025
WITH new_reward AS (
  INSERT INTO rewards (name, points, category, quantity, variant_type) 
  VALUES ('BMW M2 2025', 500000, 'Car', 1, 'color')
  RETURNING id
),
variants AS (
  INSERT INTO reward_variants (reward_id, option_name)
  SELECT id, unnest(ARRAY['Alpine White', 'Black Sapphire', 'San Marino Blue']) FROM new_reward
  RETURNING id, option_name
)
INSERT INTO reward_galleries (variant_id, image_url, image_order)
SELECT v.id, img.url, img.ord
FROM variants v
CROSS JOIN LATERAL (
  SELECT * FROM (
    VALUES 
      ('Alpine White', 'https://placehold.co/400x300/F5F5F5/000000?text=White+BMW+1', 0),
      ('Alpine White', 'https://placehold.co/400x300/FAFAFA/000000?text=White+BMW+2', 1),
      ('Alpine White', 'https://placehold.co/400x300/EFEFEF/000000?text=White+BMW+3', 2),
      ('Alpine White', 'https://placehold.co/400x300/F8F8F8/000000?text=White+BMW+4', 3),
      ('Black Sapphire', 'https://placehold.co/400x300/1C1C1C/FFFFFF?text=Black+BMW+1', 0),
      ('Black Sapphire', 'https://placehold.co/400x300/0A0A0A/FFFFFF?text=Black+BMW+2', 1),
      ('Black Sapphire', 'https://placehold.co/400x300/262626/FFFFFF?text=Black+BMW+3', 2),
      ('Black Sapphire', 'https://placehold.co/400x300/141414/FFFFFF?text=Black+BMW+4', 3),
      ('San Marino Blue', 'https://placehold.co/400x300/2B4F81/FFFFFF?text=Blue+BMW+1', 0),
      ('San Marino Blue', 'https://placehold.co/400x300/234570/FFFFFF?text=Blue+BMW+2', 1),
      ('San Marino Blue', 'https://placehold.co/400x300/335A92/FFFFFF?text=Blue+BMW+3', 2),
      ('San Marino Blue', 'https://placehold.co/400x300/2A4D7E/FFFFFF?text=Blue+BMW+4', 3)
  ) AS t(variant, url, ord)
) img
WHERE v.option_name = img.variant;

-- Yamaha Aerox 2025
WITH new_reward AS (
  INSERT INTO rewards (name, points, category, quantity, variant_type) 
  VALUES ('Yamaha Aerox 2025', 150000, 'Car', 2, 'color')
  RETURNING id
),
variants AS (
  INSERT INTO reward_variants (reward_id, option_name)
  SELECT id, unnest(ARRAY['Matte Black', 'Racing Blue', 'Matte Red']) FROM new_reward
  RETURNING id, option_name
)
INSERT INTO reward_galleries (variant_id, image_url, image_order)
SELECT v.id, img.url, img.ord
FROM variants v
CROSS JOIN LATERAL (
  SELECT * FROM (
    VALUES 
      ('Matte Black', 'https://placehold.co/400x300/1A1A1A/FFFFFF?text=Black+Aerox+1', 0),
      ('Matte Black', 'https://placehold.co/400x300/0D0D0D/FFFFFF?text=Black+Aerox+2', 1),
      ('Matte Black', 'https://placehold.co/400x300/262626/FFFFFF?text=Black+Aerox+3', 2),
      ('Matte Black', 'https://placehold.co/400x300/1F1F1F/FFFFFF?text=Black+Aerox+4', 3),
      ('Racing Blue', 'https://placehold.co/400x300/0066CC/FFFFFF?text=Blue+Aerox+1', 0),
      ('Racing Blue', 'https://placehold.co/400x300/0055BB/FFFFFF?text=Blue+Aerox+2', 1),
      ('Racing Blue', 'https://placehold.co/400x300/0077DD/FFFFFF?text=Blue+Aerox+3', 2),
      ('Racing Blue', 'https://placehold.co/400x300/0044AA/FFFFFF?text=Blue+Aerox+4', 3),
      ('Matte Red', 'https://placehold.co/400x300/B22222/FFFFFF?text=Red+Aerox+1', 0),
      ('Matte Red', 'https://placehold.co/400x300/8B0000/FFFFFF?text=Red+Aerox+2', 1),
      ('Matte Red', 'https://placehold.co/400x300/DC143C/FFFFFF?text=Red+Aerox+3', 2),
      ('Matte Red', 'https://placehold.co/400x300/A52A2A/FFFFFF?text=Red+Aerox+4', 3)
  ) AS t(variant, url, ord)
) img
WHERE v.option_name = img.variant;
