/*
  # Add treatment protocols and goals tables

  1. New Tables
    - `treatment_protocols`
      - `id` (uuid, primary key)
      - `treatment_plan_id` (uuid, foreign key)
      - `clinic_id` (uuid, foreign key)
      - `protocol_name` (text)
      - `protocol_type` (text) - supplement, lifestyle, therapy, medication
      - `dosage` (text, optional)
      - `frequency` (text, optional)
      - `priority` (text) - high, medium, low
      - `duration` (text, optional)
      - `instructions` (text, optional)
      - Standard audit fields

    - `treatment_goals`
      - `id` (uuid, primary key)
      - `treatment_plan_id` (uuid, foreign key)
      - `clinic_id` (uuid, foreign key)
      - `goal_description` (text)
      - Standard audit fields

  2. Security
    - Enable RLS on both tables
    - Add policies for clinic-based access control

  3. Changes
    - Extends treatment plan functionality
    - Adds structured protocol management
    - Adds goal tracking capabilities
*/

-- Create treatment_protocols table
CREATE TABLE IF NOT EXISTS treatment_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_plan_id uuid NOT NULL REFERENCES treatment_plans(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  protocol_name text NOT NULL,
  protocol_type text NOT NULL CHECK (protocol_type IN ('supplement', 'lifestyle', 'therapy', 'medication')),
  dosage text,
  frequency text,
  priority text CHECK (priority IN ('high', 'medium', 'low')),
  duration text,
  instructions text,
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create treatment_goals table
CREATE TABLE IF NOT EXISTS treatment_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_plan_id uuid NOT NULL REFERENCES treatment_plans(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  goal_description text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE treatment_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for treatment_protocols
CREATE POLICY "Treatment protocols: clinic access"
  ON treatment_protocols
  FOR ALL
  TO authenticated
  USING (clinic_id = (
    SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()
  ));

-- RLS Policies for treatment_goals
CREATE POLICY "Treatment goals: clinic access"
  ON treatment_goals
  FOR ALL
  TO authenticated
  USING (clinic_id = (
    SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()
  ));