/*
  # Quran Competition Registration System

  1. New Tables
    - `competition_levels`
      - `id` (uuid, primary key)
      - `name_ar` (text) - Level name in Arabic
      - `created_at` (timestamp)
    
    - `sheikhs`
      - `id` (uuid, primary key)
      - `name` (text) - Sheikh name
      - `created_at` (timestamp)
    
    - `registrations`
      - `id` (uuid, primary key)
      - `national_id` (text) - Egyptian national ID
      - `student_name` (text) - Student name in Arabic
      - `birth_certificate_url` (text) - URL to uploaded certificate image
      - `level_id` (uuid, foreign key to competition_levels)
      - `sheikh_id` (uuid, foreign key to sheikhs, nullable)
      - `custom_sheikh_name` (text, nullable) - For custom sheikh option
      - `custom_sheikh_phone` (text, nullable) - Phone for custom sheikh
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public insert access (registration form)
    - Add policies for authenticated read access
*/

CREATE TABLE IF NOT EXISTS competition_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sheikhs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  national_id text NOT NULL,
  student_name text NOT NULL,
  birth_certificate_url text NOT NULL,
  level_id uuid NOT NULL REFERENCES competition_levels(id),
  sheikh_id uuid REFERENCES sheikhs(id),
  custom_sheikh_name text,
  custom_sheikh_phone text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE competition_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheikhs ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view competition levels"
  ON competition_levels FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view sheikhs list"
  ON sheikhs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can register"
  ON registrations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view registrations"
  ON registrations FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO competition_levels (name_ar) VALUES
  ('المستوى الأول'),
  ('المستوى الثاني'),
  ('المستوى الثالث'),
  ('المستوى الرابع'),
  ('المستوى الخامس');

INSERT INTO sheikhs (name) VALUES
  ('الشيخ محمد'),
  ('الشيخ أحمد'),
  ('الشيخ عبدالله'),
  ('الشيخ حسن'),
  ('الشيخ إبراهيم');