ALTER TABLE products
ADD COLUMN generic_name             text,
ADD COLUMN dosage_strength         text,
ADD COLUMN unit_type               text,
ADD COLUMN pack_size               integer,
ADD COLUMN reorder_level           integer,
ADD COLUMN supplier                text,
ADD COLUMN manufacturer            text,
ADD COLUMN prescription_required   boolean DEFAULT false,
ADD COLUMN is_controlled           boolean DEFAULT false,
ADD COLUMN is_pos_visible          boolean DEFAULT true,
ADD COLUMN notes                   text;
