-- Clear existing services
TRUNCATE public.services RESTART IDENTITY CASCADE;

-- Seed services based on Perfect Size pricing
INSERT INTO public.services (name, description, category, base_price, estimated_days, popular, sort_order) VALUES

-- TROUSERS (category: trousers)
('Trouser Shortened', 'Professional hemming (lined £20)', 'trousers', 1500, 5, true, 1),
('Trouser Shortened with Turn Ups', 'Hemming with turn-up finish', 'trousers', 2000, 5, false, 2),
('Trouser Half Tape', 'Half tape alteration', 'trousers', 2000, 5, false, 3),
('Trouser Skinned', 'Slim fit tapering (line £35)', 'trousers', 2250, 7, false, 4),
('Trouser Waist Altered', 'Waist adjustment (lined £25)', 'trousers', 2050, 5, true, 5),
('Trouser Half Pocket', 'Half pocket alteration (each)', 'trousers', 1250, 5, false, 6),
('Trouser Lengthen with Tape', 'Lengthening with tape', 'trousers', 2000, 7, false, 7),

-- JEANS & CHINOS (category: trousers)
('Jeans Shortened', 'Standard jeans hemming', 'trousers', 1500, 5, true, 8),
('Jeans Shortened (Original Hem)', 'Preserve original hem finish', 'trousers', 2500, 7, true, 9),
('Jeans Skinned', 'Slim fit tapering', 'trousers', 2500, 7, false, 10),
('Jeans Waist Altered', 'Waist adjustment', 'trousers', 2250, 5, false, 11),
('Jeans New Button', 'Replace jean button', 'trousers', 500, 3, false, 12),

-- SHIRTS & JUMPERS (category: shirts)
('Shirt Shortened', 'Shorten shirt length', 'shirts', 1750, 5, false, 13),
('Shirt Sleeves Shortened', 'Adjust sleeve length', 'shirts', 1500, 5, true, 14),
('Shirt Take in Side Seams', 'Slim fit adjustment', 'shirts', 1500, 5, false, 15),

-- ZIPS (category: other)
('Zip Replacement - Jeans & Trousers', 'Replace trouser zip', 'other', 2000, 5, false, 16),
('Zip Replacement - Skirt & Dress', 'Replace skirt/dress zip', 'other', 2000, 5, false, 17),
('Zip Replacement - Lined', 'Lined garment zip replacement', 'other', 2500, 5, false, 18),
('Zip Replacement - Invisible', 'Invisible zip installation', 'other', 2250, 5, false, 19),
('Zip Replacement - Jacket', 'Jacket zip replacement (+ zip cost)', 'other', 3000, 7, false, 20),

-- JACKET & COATS (category: coats)
('Jacket/Coat Shortened', 'Shorten jacket or coat length', 'coats', 2750, 7, false, 21),
('Jacket/Coat Lined Shortened', 'Lined jacket shortening', 'coats', 3500, 7, false, 22),
('Jacket/Coat Sleeves Shortened', 'Shorten jacket sleeves', 'coats', 2250, 5, true, 23),
('Jacket/Coat Sleeves Lined with Buttons', 'Lined sleeve shortening with buttons', 'coats', 3750, 7, false, 24),
('Jacket/Coat Sleeves Lengthened Lined', 'Lengthen lined sleeves', 'coats', 3500, 7, false, 25),
('Jacket/Coat Sleeves Skinned', 'Slim fit sleeve adjustment', 'coats', 2250, 5, false, 26),
('Jacket/Coat Take in Centre Back Seam', 'Back seam adjustment', 'coats', 2250, 7, false, 27),
('Jacket/Coat Change Lining', 'Complete lining replacement (fabric extra)', 'coats', 13000, 14, false, 28),
('Jacket/Coat Take in Side Seams', 'Side seam adjustment', 'coats', 2750, 7, false, 29),
('Jacket/Coat Fit Shoulders', 'Shoulder adjustment', 'coats', 2750, 10, false, 30),
('Jacket/Coat Lapels Narrowed', 'Narrow lapel width', 'coats', 2750, 10, false, 31),

-- DRESSES & SKIRTS (category: dresses)
('Dress/Skirt Shortened', 'Standard hemming', 'dresses', 1750, 5, true, 32),
('Dress/Skirt Lined Shortened', 'Lined garment hemming', 'dresses', 2250, 7, true, 33),
('Dress/Skirt Take in Side Seams', 'Side seam adjustment', 'dresses', 2250, 7, false, 34),
('Dress/Skirt Take in Side Seams (Lined)', 'Lined garment side seam adjustment', 'dresses', 2750, 7, false, 35),
('Dress/Skirt Waist Altered', 'Waist adjustment', 'dresses', 2000, 5, false, 36),
('Dress/Skirt Waist Altered (Lined)', 'Lined waist adjustment', 'dresses', 2500, 5, false, 37),
('Dress Maxi Shortened', 'Maxi dress hemming', 'dresses', 2750, 7, false, 38),
('Dress Maxi Lined Shortened', 'Lined maxi dress hemming', 'dresses', 4000, 7, false, 39),

-- OTHERS (category: other)
('Sew on Button', 'Button attachment (per button)', 'other', 200, 2, false, 40),
('Button Hole', 'Create new button hole (per hole)', 'other', 300, 2, false, 41),
('Repair Small Seam/Hole', 'Minor repair work', 'other', 750, 3, false, 42),
('Pocket Seam Repair', 'Fix pocket seam', 'other', 1250, 3, false, 43),
('Jacket Hole Repair', 'Repair jacket damage', 'other', 4000, 7, false, 44),
('Curtain Shortened', 'Curtain hemming (per meter)', 'other', 700, 7, false, 45),
('Curtain Lined', 'Lined curtain hemming (per meter)', 'other', 1000, 7, false, 46);
