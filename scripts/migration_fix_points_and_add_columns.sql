-- Migration: Fix points columns and constraints
-- Description: Ensures columns exist and allows 0 points for development/functional points

-- 1. Add columns if they don't exist (safe operation)
DO $$
BEGIN
    BEGIN
        ALTER TABLE projects ADD COLUMN development_points INTEGER;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE projects ADD COLUMN functional_points INTEGER;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE projects ADD COLUMN impact_score_considered INTEGER;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE projects ADD COLUMN frequency_score_considered INTEGER;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE projects ADD COLUMN urgency_level_considered TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE projects ADD COLUMN custom_impact_weight NUMERIC;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE projects ADD COLUMN custom_frequency_weight NUMERIC;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE projects ADD COLUMN custom_urgency_weight NUMERIC;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE projects ADD COLUMN is_reviewed_by_team BOOLEAN DEFAULT FALSE;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE projects ADD COLUMN reviewed_at TIMESTAMPTZ;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE projects ADD COLUMN reviewed_by TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- 2. Drop old constraints if they exist to update them
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_development_points;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_functional_points;

-- 3. Add new constraints allowing 0 points
ALTER TABLE projects ADD CONSTRAINT check_development_points 
  CHECK (development_points IS NULL OR (development_points >= 0 AND development_points <= 15));

ALTER TABLE projects ADD CONSTRAINT check_functional_points 
  CHECK (functional_points IS NULL OR (functional_points >= 0 AND functional_points <= 15));

-- 4. Add comments
COMMENT ON COLUMN projects.development_points IS 'Estimated development size in points (0-15 scale, where 15 points = 2 weeks)';
COMMENT ON COLUMN projects.functional_points IS 'Functional complexity in points (0-15 scale)';


