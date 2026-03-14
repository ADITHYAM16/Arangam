-- Restore 5 Arangams
INSERT INTO arangams (id, name, is_active) VALUES
('arangam-1', 'VOC Arangam', true),
('arangam-2', 'Thiruvalluvar Arangam', true),
('arangam-3', 'Bharathiyar Arangam', true),
('arangam-4', 'Vivekananda Arangam', true),
('arangam-5', 'Ramakrishna Arangam', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
