-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-Tenant Isolation for Construction Manager SaaS
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE punch_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's organization_id
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS BOOLEAN AS $$
    SELECT role_type = 'Admin' FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- =====================================================
-- ORGANIZATIONS POLICIES
-- =====================================================

-- Users can view their own organization
CREATE POLICY "Users can view own organization"
    ON organizations FOR SELECT
    USING (id = get_user_organization_id());

-- Only admins can update their organization
CREATE POLICY "Admins can update own organization"
    ON organizations FOR UPDATE
    USING (id = get_user_organization_id() AND is_user_admin());

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can view profiles in their organization
CREATE POLICY "Users can view profiles in own organization"
    ON profiles FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- Admins can insert new users in their organization
CREATE POLICY "Admins can insert users in own organization"
    ON profiles FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id() AND is_user_admin());

-- Admins can update users in their organization
CREATE POLICY "Admins can update users in own organization"
    ON profiles FOR UPDATE
    USING (organization_id = get_user_organization_id() AND is_user_admin());

-- =====================================================
-- PROJECTS POLICIES
-- =====================================================

-- Users can view projects in their organization
CREATE POLICY "Users can view projects in own organization"
    ON projects FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Admins can create projects in their organization
CREATE POLICY "Admins can create projects in own organization"
    ON projects FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id() AND is_user_admin());

-- Admins can update projects in their organization
CREATE POLICY "Admins can update projects in own organization"
    ON projects FOR UPDATE
    USING (organization_id = get_user_organization_id() AND is_user_admin());

-- Admins can delete projects in their organization
CREATE POLICY "Admins can delete projects in own organization"
    ON projects FOR DELETE
    USING (organization_id = get_user_organization_id() AND is_user_admin());

-- =====================================================
-- TASKS POLICIES
-- =====================================================

-- Users can view tasks in their organization
CREATE POLICY "Users can view tasks in own organization"
    ON tasks FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Users can create tasks in their organization
CREATE POLICY "Users can create tasks in own organization"
    ON tasks FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

-- Users can update tasks assigned to them or if they're admin
CREATE POLICY "Users can update own tasks or admins can update all"
    ON tasks FOR UPDATE
    USING (
        organization_id = get_user_organization_id() 
        AND (assignee_id = auth.uid() OR is_user_admin())
    );

-- Admins can delete tasks in their organization
CREATE POLICY "Admins can delete tasks in own organization"
    ON tasks FOR DELETE
    USING (organization_id = get_user_organization_id() AND is_user_admin());

-- =====================================================
-- TIME LOGS POLICIES
-- =====================================================

-- Users can view time logs in their organization
CREATE POLICY "Users can view time logs in own organization"
    ON time_logs FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Users can create their own time logs
CREATE POLICY "Users can create own time logs"
    ON time_logs FOR INSERT
    WITH CHECK (
        organization_id = get_user_organization_id() 
        AND user_id = auth.uid()
    );

-- Users can update their own time logs
CREATE POLICY "Users can update own time logs"
    ON time_logs FOR UPDATE
    USING (
        organization_id = get_user_organization_id() 
        AND user_id = auth.uid()
    );

-- Admins can delete time logs in their organization
CREATE POLICY "Admins can delete time logs in own organization"
    ON time_logs FOR DELETE
    USING (organization_id = get_user_organization_id() AND is_user_admin());

-- =====================================================
-- PUNCH LIST ITEMS POLICIES
-- =====================================================

-- Users can view punch list items in their organization
CREATE POLICY "Users can view punch list items in own organization"
    ON punch_list_items FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Users can create punch list items in their organization
CREATE POLICY "Users can create punch list items in own organization"
    ON punch_list_items FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

-- Users can update punch list items in their organization
CREATE POLICY "Users can update punch list items in own organization"
    ON punch_list_items FOR UPDATE
    USING (organization_id = get_user_organization_id());

-- Admins can delete punch list items in their organization
CREATE POLICY "Admins can delete punch list items in own organization"
    ON punch_list_items FOR DELETE
    USING (organization_id = get_user_organization_id() AND is_user_admin());

-- =====================================================
-- PROJECT PHOTOS POLICIES
-- =====================================================

-- Users can view photos in their organization
CREATE POLICY "Users can view photos in own organization"
    ON project_photos FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Users can upload photos in their organization
CREATE POLICY "Users can upload photos in own organization"
    ON project_photos FOR INSERT
    WITH CHECK (
        organization_id = get_user_organization_id()
        AND uploaded_by = auth.uid()
    );

-- Admins can delete photos in their organization
CREATE POLICY "Admins can delete photos in own organization"
    ON project_photos FOR DELETE
    USING (organization_id = get_user_organization_id() AND is_user_admin());

-- =====================================================
-- INVENTORY ITEMS POLICIES
-- =====================================================

-- Users can view inventory in their organization
CREATE POLICY "Users can view inventory in own organization"
    ON inventory_items FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Admins can create inventory items in their organization
CREATE POLICY "Admins can create inventory in own organization"
    ON inventory_items FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id() AND is_user_admin());

-- Users can update inventory quantities in their organization
CREATE POLICY "Users can update inventory in own organization"
    ON inventory_items FOR UPDATE
    USING (organization_id = get_user_organization_id());

-- Admins can delete inventory items in their organization
CREATE POLICY "Admins can delete inventory in own organization"
    ON inventory_items FOR DELETE
    USING (organization_id = get_user_organization_id() AND is_user_admin());

-- =====================================================
-- ESTIMATES POLICIES
-- =====================================================

-- Users can view estimates in their organization
CREATE POLICY "Users can view estimates in own organization"
    ON estimates FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Admins can create estimates in their organization
CREATE POLICY "Admins can create estimates in own organization"
    ON estimates FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id() AND is_user_admin());

-- Admins can update estimates in their organization
CREATE POLICY "Admins can update estimates in own organization"
    ON estimates FOR UPDATE
    USING (organization_id = get_user_organization_id() AND is_user_admin());

-- Admins can delete estimates in their organization
CREATE POLICY "Admins can delete estimates in own organization"
    ON estimates FOR DELETE
    USING (organization_id = get_user_organization_id() AND is_user_admin());

-- =====================================================
-- ESTIMATE ITEMS POLICIES
-- =====================================================

-- Users can view estimate items in their organization
CREATE POLICY "Users can view estimate items in own organization"
    ON estimate_items FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Admins can manage estimate items in their organization
CREATE POLICY "Admins can create estimate items in own organization"
    ON estimate_items FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id() AND is_user_admin());

CREATE POLICY "Admins can update estimate items in own organization"
    ON estimate_items FOR UPDATE
    USING (organization_id = get_user_organization_id() AND is_user_admin());

CREATE POLICY "Admins can delete estimate items in own organization"
    ON estimate_items FOR DELETE
    USING (organization_id = get_user_organization_id() AND is_user_admin());

-- =====================================================
-- EXPENSES POLICIES
-- =====================================================

-- Users can view expenses in their organization
CREATE POLICY "Users can view expenses in own organization"
    ON expenses FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Users can create expenses in their organization
CREATE POLICY "Users can create expenses in own organization"
    ON expenses FOR INSERT
    WITH CHECK (
        organization_id = get_user_organization_id()
        AND created_by = auth.uid()
    );

-- Admins can update expenses in their organization
CREATE POLICY "Admins can update expenses in own organization"
    ON expenses FOR UPDATE
    USING (organization_id = get_user_organization_id() AND is_user_admin());

-- Admins can delete expenses in their organization
CREATE POLICY "Admins can delete expenses in own organization"
    ON expenses FOR DELETE
    USING (organization_id = get_user_organization_id() AND is_user_admin());
