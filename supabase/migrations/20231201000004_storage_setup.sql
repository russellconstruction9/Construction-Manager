-- =====================================================
-- STORAGE BUCKETS AND POLICIES
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('project-photos', 'project-photos', true),
    ('map-images', 'map-images', false),
    ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PROJECT PHOTOS BUCKET POLICIES
-- =====================================================

-- Allow authenticated users to upload photos to their organization's folder
CREATE POLICY "Users can upload project photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'project-photos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (
        SELECT organization_id::text 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

-- Allow authenticated users to view photos from their organization
CREATE POLICY "Users can view project photos from own organization"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'project-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (
        SELECT organization_id::text 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

-- Allow admins to delete photos from their organization
CREATE POLICY "Admins can delete project photos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'project-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (
        SELECT organization_id::text 
        FROM profiles 
        WHERE id = auth.uid()
    )
    AND (
        SELECT role_type = 'Admin'
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- =====================================================
-- MAP IMAGES BUCKET POLICIES
-- =====================================================

-- Allow authenticated users to upload map images to their organization's folder
CREATE POLICY "Users can upload map images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'map-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (
        SELECT organization_id::text 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

-- Allow authenticated users to view map images from their organization
CREATE POLICY "Users can view map images from own organization"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'map-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (
        SELECT organization_id::text 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

-- =====================================================
-- RECEIPTS BUCKET POLICIES
-- =====================================================

-- Allow authenticated users to upload receipts to their organization's folder
CREATE POLICY "Users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'receipts' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (
        SELECT organization_id::text 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

-- Allow authenticated users to view receipts from their organization
CREATE POLICY "Users can view receipts from own organization"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'receipts'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (
        SELECT organization_id::text 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

-- Allow admins to delete receipts from their organization
CREATE POLICY "Admins can delete receipts"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'receipts'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (
        SELECT organization_id::text 
        FROM profiles 
        WHERE id = auth.uid()
    )
    AND (
        SELECT role_type = 'Admin'
        FROM profiles
        WHERE id = auth.uid()
    )
);
