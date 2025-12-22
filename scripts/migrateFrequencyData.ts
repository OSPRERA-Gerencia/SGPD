import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and a suitable KEY must be set in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Scale:
 * - >1 per day -> 5
 * - 1 per day -> 4
 * - 1 per week -> 3
 * - 1 per 2 weeks -> 2
 * - 1 per month -> 1
 */
function calculateScore(n: number, u: string): number {
    if (u === 'day') return n > 1 ? 5 : 4;
    if (u === 'week') return n >= 1 ? 3 : 2;
    if (u === 'month') return n >= 4 ? 4 : (n >= 2 ? 2 : 1);
    return 1;
}

function parseDescription(desc: string | null): { number: number; unit: string } {
    if (!desc) return { number: 1, unit: 'week' };

    const d = desc.toLowerCase();

    if (d.includes('dia') || d.includes('día')) {
        const match = d.match(/(\d+)/);
        return { number: match ? parseInt(match[0]) : 1, unit: 'day' };
    }

    if (d.includes('semana')) {
        const match = d.match(/(\d+)/);
        return { number: match ? parseInt(match[0]) : 1, unit: 'week' };
    }

    if (d.includes('mes')) {
        const match = d.match(/(\d+)/);
        return { number: match ? parseInt(match[0]) : 1, unit: 'month' };
    }

    return { number: 1, unit: 'week' };
}

async function migrate() {
    console.log('Starting migration...');

    const { data: projects, error } = await supabase
        .from('projects')
        .select('id, frequency_description, frequency_score');

    if (error) {
        console.error('Error fetching projects:', error);
        return;
    }

    console.log(`Found ${projects.length} projects to process.`);

    for (const project of projects) {
        const { number, unit } = parseDescription(project.frequency_description);
        const newScore = calculateScore(number, unit);

        console.log(`Project ${project.id}: "${project.frequency_description}" -> ${number} / ${unit} (Score: ${newScore})`);

        const { error: updateError } = await supabase
            .from('projects')
            .update({
                frequency_number: number,
                frequency_unit: unit,
                frequency_score: newScore
                // Note: we might want to update score_raw and score_weighted too, 
                // but that requires fetching weights and other scores. 
                // For now, updating the base frequency score is the first step.
            })
            .eq('id', project.id);

        if (updateError) {
            console.error(`Error updating project ${project.id}:`, updateError);
        }
    }

    console.log('Migration finished.');
}

migrate();
