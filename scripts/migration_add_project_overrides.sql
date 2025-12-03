-- Migration: Add override values, custom weights, and development points to projects table
-- Description: Allows the review team to override submitted values, customize priority weights per project, and track development size

-- Add override/considered values (what the review team decides vs what was submitted)
ALTER TABLE projects ADD COLUMN impact_score_considered INTEGER;
ALTER TABLE projects ADD COLUMN frequency_score_considered INTEGER;
ALTER TABLE projects ADD COLUMN urgency_level_considered TEXT;

-- Add custom priority weights per project (nullable, falls back to global weights)
ALTER TABLE projects ADD COLUMN custom_impact_weight NUMERIC;
ALTER TABLE projects ADD COLUMN custom_frequency_weight NUMERIC;
ALTER TABLE projects ADD COLUMN custom_urgency_weight NUMERIC;

-- Add development size in points (1-15 scale)
ALTER TABLE projects ADD COLUMN development_points INTEGER;
ALTER TABLE projects ADD COLUMN functional_points INTEGER;

-- Add constraints to ensure data integrity
ALTER TABLE projects ADD CONSTRAINT check_impact_score_considered 
  CHECK (impact_score_considered IS NULL OR (impact_score_considered >= 1 AND impact_score_considered <= 5));
  
ALTER TABLE projects ADD CONSTRAINT check_frequency_score_considered 
  CHECK (frequency_score_considered IS NULL OR (frequency_score_considered >= 1 AND frequency_score_considered <= 5));
  
ALTER TABLE projects ADD CONSTRAINT check_urgency_level_considered 
  CHECK (urgency_level_considered IS NULL OR urgency_level_considered IN ('high', 'medium', 'low'));
  
ALTER TABLE projects ADD CONSTRAINT check_development_points 
  CHECK (development_points IS NULL OR (development_points >= 1 AND development_points <= 15));

ALTER TABLE projects ADD CONSTRAINT check_functional_points 
  CHECK (functional_points IS NULL OR (functional_points >= 1 AND functional_points <= 15));

ALTER TABLE projects ADD CONSTRAINT check_custom_impact_weight 
  CHECK (custom_impact_weight IS NULL OR custom_impact_weight >= 0);
  
ALTER TABLE projects ADD CONSTRAINT check_custom_frequency_weight 
  CHECK (custom_frequency_weight IS NULL OR custom_frequency_weight >= 0);
  
ALTER TABLE projects ADD CONSTRAINT check_custom_urgency_weight 
  CHECK (custom_urgency_weight IS NULL OR custom_urgency_weight >= 0);

-- Add comments for documentation
COMMENT ON COLUMN projects.impact_score_considered IS 'Override value for impact score determined by review team';
COMMENT ON COLUMN projects.frequency_score_considered IS 'Override value for frequency score determined by review team';
COMMENT ON COLUMN projects.urgency_level_considered IS 'Override value for urgency level determined by review team';
COMMENT ON COLUMN projects.custom_impact_weight IS 'Custom impact weight for this project (overrides global weight)';
COMMENT ON COLUMN projects.custom_frequency_weight IS 'Custom frequency weight for this project (overrides global weight)';
COMMENT ON COLUMN projects.custom_urgency_weight IS 'Custom urgency weight for this project (overrides global weight)';
COMMENT ON COLUMN projects.development_points IS 'Estimated development size in points (1-15 scale, where 15 points = 2 weeks)';
COMMENT ON COLUMN projects.functional_points IS 'Functional complexity in points (1-15 scale)';
