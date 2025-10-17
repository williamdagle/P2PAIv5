/*
  # Setup Supabase Auth Integration

  1. Changes
    - Create trigger to sync Supabase auth.users with custom users table
    - Add RLS policies for proper clinic-based access
    - Ensure existing users can authenticate via Supabase Auth

  2. Security
    - Enable RLS on all tables
    - Add proper policies for clinic-based data access
    - Sync user authentication between auth.users and custom users table

  3. Notes
    - Existing users will need to be migrated to Supabase Auth
    - Passwords will need to be reset for security
*/

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- When a new user signs up via Supabase Auth, create corresponding record in users table
  INSERT INTO public.users (id, email, full_name, clinic_id, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    (NEW.raw_user_meta_data->>'clinic_id')::uuid,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for better security

-- Clinical Notes policies
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinical notes: clinic access"
  ON clinical_notes
  FOR ALL
  TO authenticated
  USING (
    clinic_id = (
      SELECT clinic_id 
      FROM users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    clinic_id = (
      SELECT clinic_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Treatment Plans policies
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Treatment plans: clinic access"
  ON treatment_plans
  FOR ALL
  TO authenticated
  USING (
    clinic_id = (
      SELECT clinic_id 
      FROM users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    clinic_id = (
      SELECT clinic_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Treatment Goals policies
ALTER TABLE treatment_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Treatment goals: clinic access"
  ON treatment_goals
  FOR ALL
  TO authenticated
  USING (
    clinic_id = (
      SELECT clinic_id 
      FROM users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    clinic_id = (
      SELECT clinic_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Treatment Protocols policies
ALTER TABLE treatment_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Treatment protocols: clinic access"
  ON treatment_protocols
  FOR ALL
  TO authenticated
  USING (
    clinic_id = (
      SELECT clinic_id 
      FROM users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    clinic_id = (
      SELECT clinic_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Timeline Events policies
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Timeline events: clinic access"
  ON timeline_events
  FOR ALL
  TO authenticated
  USING (
    clinic_id = (
      SELECT clinic_id 
      FROM users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    clinic_id = (
      SELECT clinic_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Medications policies
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Medications: clinic access"
  ON medications
  FOR ALL
  TO authenticated
  USING (
    clinic_id = (
      SELECT clinic_id 
      FROM users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    clinic_id = (
      SELECT clinic_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Supplements policies
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supplements: clinic access"
  ON supplements
  FOR ALL
  TO authenticated
  USING (
    clinic_id = (
      SELECT clinic_id 
      FROM users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    clinic_id = (
      SELECT clinic_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Labs policies
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Labs: clinic access"
  ON labs
  FOR ALL
  TO authenticated
  USING (
    clinic_id = (
      SELECT clinic_id 
      FROM users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    clinic_id = (
      SELECT clinic_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Attachments policies
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attachments: clinic access"
  ON attachments
  FOR ALL
  TO authenticated
  USING (
    clinic_id = (
      SELECT clinic_id 
      FROM users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    clinic_id = (
      SELECT clinic_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );