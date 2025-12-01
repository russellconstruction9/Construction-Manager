-- =====================================================
-- AUTH TRIGGERS AND FUNCTIONS
-- Automatically create organization and profile on signup
-- =====================================================

-- Function to create organization and profile after user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    org_name TEXT;
    org_slug TEXT;
BEGIN
    -- Get organization name from user metadata
    org_name := NEW.raw_user_meta_data->>'organization_name';
    
    -- If organization name provided, create new organization
    IF org_name IS NOT NULL AND org_name != '' THEN
        -- Generate slug from organization name
        org_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
        org_slug := regexp_replace(org_slug, '^-+|-+$', '', 'g');
        
        -- Make slug unique by appending random string if needed
        org_slug := org_slug || '-' || substr(md5(random()::text), 1, 8);
        
        -- Create organization
        INSERT INTO organizations (name, slug)
        VALUES (org_name, org_slug)
        RETURNING id INTO new_org_id;
        
        -- Create admin profile for the user
        INSERT INTO profiles (
            id,
            organization_id,
            email,
            full_name,
            role_title,
            role_type,
            hourly_rate
        ) VALUES (
            NEW.id,
            new_org_id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
            'Owner',
            'Admin',
            0
        );
    ELSE
        -- If no organization name, user needs to be invited to an organization
        -- Create a basic profile (organization_id will be set when invited)
        INSERT INTO profiles (
            id,
            organization_id,
            email,
            full_name,
            role_title,
            role_type,
            hourly_rate
        ) VALUES (
            NEW.id,
            '00000000-0000-0000-0000-000000000000'::UUID, -- Placeholder
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
            'Employee',
            'Employee',
            0
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user after user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Function to handle user deletion
CREATE OR REPLACE FUNCTION handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Profile will be deleted automatically via CASCADE
    -- Check if this was the last admin in the organization
    -- If so, you might want to prevent deletion or handle specially
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user deletion
CREATE TRIGGER on_auth_user_deleted
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_user_delete();
