-- Create ENUM types for Proposals
CREATE TYPE proposal_status AS ENUM('draft', 'submitted', 'under_review', 'accepted', 'rejected', 'withdrawn');

-- Freelancer proposals for projects
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    freelancer_id UUID NOT NULL REFERENCES users(id),

    -- Proposal Content
    cover_letter TEXT NOT NULL,
    proposed_amount DECIMAL(15,2) NOT NULL,
    proposed_timeline INTEGER NOT NULL, -- in days

    -- AI Analysis
    ai_generated_letter BOOLEAN DEFAULT false,
    ai_match_score DECIMAL(5,2), -- 0.00 to 100.00
    ai_risk_score DECIMAL(5,2), -- 0.00 to 100.00

    -- Custom Milestones
    custom_milestones JSONB,

    -- Proposal Status
    status proposal_status DEFAULT 'submitted',

    -- Client Interaction
    client_viewed BOOLEAN DEFAULT false,
    client_viewed_at TIMESTAMP,
    client_shortlisted BOOLEAN DEFAULT false,
    client_notes TEXT,

    -- Response Details
    response_message TEXT,
    responded_at TIMESTAMP,

    -- Interview & Questions
    interview_requested BOOLEAN DEFAULT false,
    interview_scheduled_at TIMESTAMP,

    -- Auto-expiry
    expires_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE (project_id, freelancer_id)
);

-- Indexes for proposals table
CREATE INDEX idx_proposals_project ON proposals(project_id);
CREATE INDEX idx_proposals_freelancer ON proposals(freelancer_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_match_score ON proposals(ai_match_score);

-- Proposal attachments (portfolio samples, etc.)
CREATE TABLE proposal_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,

    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for proposal_attachments table
CREATE INDEX idx_proposal_attachments_proposal ON proposal_attachments(proposal_id);