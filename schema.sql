-- ALETHEON DATABASE SCHEMA
-- For use in Supabase SQL Editor

-- 1. PROFILES Table (Extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  institution TEXT,
  specialization TEXT,
  role TEXT DEFAULT 'archaeologist',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);


-- 2. ARTIFACTS Table
CREATE TABLE public.artifacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  classification TEXT,
  description TEXT,
  material TEXT,
  era TEXT,
  region TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  excavation_notes TEXT,
  ai_report JSONB,
  confidence_score DECIMAL(5,4),
  status TEXT DEFAULT 'stable' CHECK (status IN ('stable', 'critical', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for artifacts
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artifacts are viewable by authenticated users." ON public.artifacts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their own artifacts." ON public.artifacts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artifacts." ON public.artifacts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);


-- 3. ARTIFACT_IMAGES Table
CREATE TABLE public.artifact_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artifact_id UUID REFERENCES public.artifacts(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for artifact images
ALTER TABLE public.artifact_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Images are viewable by authenticated users." ON public.artifact_images
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can upload images to their artifacts." ON public.artifact_images
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.artifacts 
      WHERE id = artifact_id AND user_id = auth.uid()
    )
  );


-- 4. GROUPS (Teams) Table
CREATE TABLE public.groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. GROUP_MEMBERS Table
CREATE TABLE public.group_members (
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Enable RLS for groups and members
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Groups are viewable by their members." ON public.groups
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Memberships are viewable by members." ON public.group_members
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.group_members AS m
      WHERE m.group_id = group_id AND m.user_id = auth.uid()
    )
  );


-- 6. MESSAGES Table
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id), -- Null for group messages
  group_id UUID REFERENCES public.groups(id),       -- Null for direct messages
  content TEXT NOT NULL,
  artifact_id UUID REFERENCES public.artifacts(id), -- Optional sharing of artifact
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see direct messages to/from them." ON public.messages
  FOR SELECT TO authenticated USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

CREATE POLICY "Users can see group messages in their groups." ON public.messages
  FOR SELECT TO authenticated USING (
    group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = messages.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages." ON public.messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());


-- 7. SIMILAR_ARTIFACTS_CACHE (Optional)
CREATE TABLE public.similar_artifacts_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artifact_id UUID REFERENCES public.artifacts(id) ON DELETE CASCADE NOT NULL,
  results JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for profile creation on auth sign up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
