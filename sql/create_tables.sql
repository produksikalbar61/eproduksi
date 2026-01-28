-- sql/create_tables.sql

-- Enable pgcrypto for gen_random_uuid() (Supabase supports this)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Sequence for surat_tugas numbering
CREATE SEQUENCE IF NOT EXISTS surat_tugas_seq;

-- Employees table (pegawai)
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nip_bps text UNIQUE,
  nip text UNIQUE,
  email text UNIQUE,
  nama text NOT NULL,
  jabatan text,
  tmt_jabatan date,
  gol_akhir text,
  tmt_gol date,
  status text,
  pendidikan_sk text,
  tmt_cpns date,
  tempat_lahir text,
  tgl_lahir date,
  jenis_kelamin text,
  agama text,
  username text,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

-- Surat Tugas table
CREATE TABLE IF NOT EXISTS surat_tugas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seq bigint UNIQUE DEFAULT nextval('surat_tugas_seq'),
  nomor text UNIQUE,
  tujuan text,
  pegawai_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  start_date date,
  end_date date,
  keterangan text,
  created_by text,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);

-- Trigger function to set `nomor` after insert using seq and year
CREATE OR REPLACE FUNCTION set_surat_tugas_nomor()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- If nomor already provided, keep it
  IF NEW.nomor IS NULL THEN
    UPDATE surat_tugas
    SET nomor = concat('ST/', to_char(NEW.created_at, 'YYYY'), '/', lpad(NEW.seq::text, 4, '0'))
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: after insert so seq is populated
DROP TRIGGER IF EXISTS trg_set_nomor ON surat_tugas;
CREATE TRIGGER trg_set_nomor
AFTER INSERT ON surat_tugas
FOR EACH ROW
EXECUTE FUNCTION set_surat_tugas_nomor();

-- Example seed data for employees
INSERT INTO employees (nip_bps, nip, nama, jabatan, username)
VALUES
  ('123456789', '198001012010011001', 'Andi Wijaya', 'Staf', 'andi.wijaya')
ON CONFLICT (nip_bps) DO NOTHING;

INSERT INTO employees (nip_bps, nip, nama, jabatan, username)
VALUES
  ('987654321', '198502022012021002', 'Siti Aminah', 'Kepala', 'siti.aminah')
ON CONFLICT (nip_bps) DO NOTHING;

-- Example insert into surat_tugas to demonstrate nomor generation
-- INSERT INTO surat_tugas (tujuan, pegawai_id, start_date, end_date, keterangan, created_by)
-- VALUES ('Pelatihan Teknis', (SELECT id FROM employees WHERE nama='Andi Wijaya'), '2026-02-01', '2026-02-03', 'Keterangan', 'admin');

-- When you run the above insert, the trigger will fill `nomor` like ST/2026/0001
