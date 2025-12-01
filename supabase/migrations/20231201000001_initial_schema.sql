-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- MULTI-TENANT SAAS SCHEMA FOR CONSTRUCTION MANAGER
-- =====================================================

-- Organizations (Tenants) Table
-- Each construction company is an organization
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due')),
    subscription_plan TEXT DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
    settings JSONB DEFAULT '{}'::JSONB
);

-- Profiles Table (extends auth.users)
-- Links users to organizations with roles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role_title TEXT NOT NULL, -- Job title (e.g., "Project Manager", "Foreman")
    role_type TEXT NOT NULL CHECK (role_type IN ('Admin', 'Employee')),
    hourly_rate DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, email)
);

-- Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    project_type TEXT NOT NULL CHECK (project_type IN ('New Construction', 'Renovation', 'Demolition', 'Interior Fit-Out')),
    status TEXT NOT NULL DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Completed', 'On Hold')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget DECIMAL(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Done')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Time Logs Table (Time Tracking)
CREATE TABLE time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    clock_in TIMESTAMPTZ NOT NULL,
    clock_out TIMESTAMPTZ,
    duration_ms BIGINT,
    cost DECIMAL(10, 2),
    clock_in_location JSONB, -- {lat: number, lng: number}
    clock_out_location JSONB,
    clock_in_map_image TEXT, -- Storage path
    clock_out_map_image TEXT, -- Storage path
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Punch List Items Table
CREATE TABLE punch_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project Photos Table
CREATE TABLE project_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    description TEXT,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inventory Items Table
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    low_stock_threshold INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Estimates Table
CREATE TABLE estimates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Approved', 'Rejected')),
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_estimated_hours DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Estimate Items Table
CREATE TABLE estimate_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('Labor', 'Material', 'Subcontractor', 'Equipment', 'Other')),
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(15, 2) NOT NULL,
    estimated_hours DECIMAL(10, 2), -- Only for Labor
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expenses Table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    expense_date DATE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Labor', 'Material', 'Subcontractor', 'Equipment', 'Other')),
    receipt_url TEXT, -- Storage path
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_profiles_org ON profiles(organization_id);
CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_tasks_org ON tasks(organization_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_time_logs_org ON time_logs(organization_id);
CREATE INDEX idx_time_logs_user ON time_logs(user_id);
CREATE INDEX idx_time_logs_project ON time_logs(project_id);
CREATE INDEX idx_punch_list_project ON punch_list_items(project_id);
CREATE INDEX idx_photos_project ON project_photos(project_id);
CREATE INDEX idx_inventory_org ON inventory_items(organization_id);
CREATE INDEX idx_estimates_org ON estimates(organization_id);
CREATE INDEX idx_estimates_project ON estimates(project_id);
CREATE INDEX idx_estimate_items_estimate ON estimate_items(estimate_id);
CREATE INDEX idx_expenses_org ON expenses(organization_id);
CREATE INDEX idx_expenses_project ON expenses(project_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_logs_updated_at BEFORE UPDATE ON time_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_punch_list_items_updated_at BEFORE UPDATE ON punch_list_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimates_updated_at BEFORE UPDATE ON estimates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
