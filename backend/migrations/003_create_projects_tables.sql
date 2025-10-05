-- Create ENUM types for Projects
CREATE TYPE project_budget_type AS ENUM('fixed', 'hourly', 'milestone');
CREATE TYPE project_experience_level AS ENUM('entry', 'intermediate', 'expert');
CREATE TYPE project_status AS ENUM('draft', 'published', 'in_progress', 'completed', 'cancelled', 'disputed');
CREATE TYPE project_visibility AS ENUM('public', 'private', 'invite_only');
CREATE TYPE project_file_scan_status AS ENUM('pending', 'clean', 'infected', 'error');
CREATE TYPE project_milestone_status AS ENUM('pending', 'in_progress', 'completed', 'disputed');

-- Project categories
CREATE TABLE project_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    parent_id UUID REFERENCES project_categories(id),
    commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Platform commission
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Main projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES users(id),
    category_id UUID NOT NULL REFERENCES project_categories(id),

    -- Basic Information
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),

    -- AI Generated Content
    ai_generated_summary TEXT,
    ai_suggested_skills TEXT[], -- Array of skill suggestions
    ai_complexity_score DECIMAL(3,2), -- 0.00 to 5.00
    ai_estimated_hours INTEGER,

    -- Budget & Payment
    budget_type project_budget_type NOT NULL,
    budget_min DECIMAL(15,2),
    budget_max DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',

    -- Timeline
    estimated_duration INTEGER, -- in days
    deadline DATE,
    start_date DATE,
    is_urgent BOOLEAN DEFAULT false,

    -- Requirements
    experience_level project_experience_level DEFAULT 'intermediate',
    required_skills UUID[] DEFAULT '{}', -- Array of skill IDs
    preferred_skills UUID[] DEFAULT '{}',

    -- Location & Remote Work
    is_remote BOOLEAN DEFAULT true,
    location_required VARCHAR(200),
    timezone_preference VARCHAR(50),

    -- Project Status
    status project_status DEFAULT 'draft',
    visibility project_visibility DEFAULT 'public',

    -- Engagement Settings
    max_proposals INTEGER DEFAULT 50,
    auto_accept_proposals BOOLEAN DEFAULT false,
    allow_questions BOOLEAN DEFAULT true,

    -- Statistics
    view_count INTEGER DEFAULT 0,
    proposal_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,

    -- Featured & Promotion
    is_featured BOOLEAN DEFAULT false,
    featured_until TIMESTAMP,
    promoted_until TIMESTAMP,

    -- Assignment
    assigned_freelancer_id UUID REFERENCES users(id),
    assigned_at TIMESTAMP,

    -- Completion & Rating
    completed_at TIMESTAMP,
    client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
    client_feedback TEXT,
    freelancer_rating INTEGER CHECK (freelancer_rating >= 1 AND freelancer_rating <= 5),
    freelancer_feedback TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes for projects table
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_category ON projects(category_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_budget ON projects(budget_min, budget_max);
CREATE INDEX idx_projects_featured ON projects(is_featured);
CREATE INDEX idx_projects_published ON projects(published_at);
-- Note: FULLTEXT INDEX is not standard in PostgreSQL. Using tsvector for search is preferred.
-- This will be handled by the application logic or a separate migration.

-- Project files and attachments
CREATE TABLE project_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id),

    -- File Information
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),

    -- File Metadata
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64), -- For duplicate detection

    -- File Status
    is_public BOOLEAN DEFAULT false,
    virus_scan_status project_file_scan_status DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for project_files table
CREATE INDEX idx_project_files_project ON project_files(project_id);
CREATE INDEX idx_project_files_uploader ON project_files(uploaded_by);

-- Project milestones for staged payments
CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    title VARCHAR(200) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    due_date DATE,

    status project_milestone_status DEFAULT 'pending',

    -- Completion Details
    completed_at TIMESTAMP,
    completion_notes TEXT,
    client_approved BOOLEAN DEFAULT false,
    client_approved_at TIMESTAMP,

    -- Payment
    payment_released BOOLEAN DEFAULT false,
    payment_released_at TIMESTAMP,

    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for project_milestones table
CREATE INDEX idx_milestones_project ON project_milestones(project_id);
CREATE INDEX idx_milestones_status ON project_milestones(status);