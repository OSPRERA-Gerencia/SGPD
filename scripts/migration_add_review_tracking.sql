-- Migration: Add is_reviewed_by_team flag and ready_for_sprint status
-- This allows marking projects that have been reviewed and confirmed by the team

-- Add reviewed flag
ALTER TABLE projects ADD COLUMN is_reviewed_by_team BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE projects ADD COLUMN reviewed_by TEXT;

-- Add comment
COMMENT ON COLUMN projects.is_reviewed_by_team IS 'True when team has confirmed override values (impact, frequency, urgency)';
COMMENT ON COLUMN projects.reviewed_at IS 'Timestamp when project was marked as reviewed';
COMMENT ON COLUMN projects.reviewed_by IS 'Email or ID of team member who reviewed the project';

-- Create index for filtering reviewed projects
CREATE INDEX idx_projects_reviewed ON projects(is_reviewed_by_team) WHERE is_reviewed_by_team = TRUE;
