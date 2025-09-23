
export type DiffResult = {
    type: 'added' | 'removed' | 'unchanged';
    value: string;
};

// A simple line-based diff implementation using a standard Longest Common Subsequence (LCS) algorithm.
export const createDiff = (oldText: string, newText: string): DiffResult[] => {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');

    const matrix = Array(oldLines.length + 1).fill(null).map(() => Array(newLines.length + 1).fill(0));

    // Populate the LCS matrix
    for (let i = 1; i <= oldLines.length; i++) {
        for (let j = 1; j <= newLines.length; j++) {
            if (oldLines[i - 1] === newLines[j - 1]) {
                matrix[i][j] = 1 + matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
            }
        }
    }

    // Backtrack through the matrix to build the diff
    const diffResult: DiffResult[] = [];
    let i = oldLines.length;
    let j = newLines.length;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
            // Unchanged line
            diffResult.unshift({ type: 'unchanged', value: oldLines[i - 1] });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
            // Added line
            diffResult.unshift({ type: 'added', value: newLines[j - 1] });
            j--;
        } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
            // Removed line
            diffResult.unshift({ type: 'removed', value: oldLines[i - 1] });
            i--;
        }
    }

    return diffResult;
};
