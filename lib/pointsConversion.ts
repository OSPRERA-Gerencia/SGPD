// Utility functions for converting development points to estimated time
// Reference: 2 weeks (10 business days) = 15 points

/**
 * Converts development points to estimated days
 * Based on reference: 15 points = 10 business days (2 weeks)
 * @param points Development points (typically 1-5)
 * @returns Estimated business days
 */
export const convertPointsToDays = (points: number): number => {
    if (points <= 0) return 0;
    // 15 points = 10 days, so days = (points / 15) * 10
    return (points / 15) * 10;
};

/**
 * Converts development points to a human-readable time estimate
 * @param points Development points
 * @returns Formatted string like "2 días", "1.5 semanas", etc.
 */
export const getEstimatedTimeLabel = (points: number | null): string => {
    if (points === null || points === 0) return '—';

    const days = convertPointsToDays(points);

    if (days < 1) {
        return `${days.toFixed(1)} días`;
    } else if (days < 5) {
        return `${days.toFixed(1)} días`;
    } else {
        const weeks = days / 5; // 5 business days per week
        return `${weeks.toFixed(1)} semanas`;
    }
};

/**
 * Gets a reference table for points to time conversion
 * Useful for displaying to users
 */
export const getPointsConversionTable = (): Array<{ points: number; days: number; label: string }> => {
    const pointValues = [1, 2, 3, 4, 5, 10, 15, 20];

    return pointValues.map(points => ({
        points,
        days: convertPointsToDays(points),
        label: getEstimatedTimeLabel(points),
    }));
};
