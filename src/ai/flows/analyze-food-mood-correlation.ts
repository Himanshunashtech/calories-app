
'use server';
/**
 * @fileOverview Analyzes correlations between logged meals/nutrients and user moods.
 *
 * - analyzeFoodMoodCorrelation - A function that returns correlation insights.
 * - AnalyzeFoodMoodCorrelationInput - The input type.
 * - AnalyzeFoodMoodCorrelationOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MealWithMoodSchema = z.object({
    description: z.string().optional().describe("Description of the meal."),
    calories: z.number().describe("Calories in the meal."),
    protein: z.number().describe("Protein in grams."),
    carbs: z.number().describe("Carbohydrates in grams."),
    fat: z.number().describe("Fats in grams."),
    // detailedNutrients: z.any().optional().describe("Optional detailed micronutrient breakdown."), // Could be added for deeper analysis
    mood: z.enum(['happy', 'neutral', 'sad']).optional().describe("User's logged mood associated with or after this meal."),
    date: z.string().describe("Date/time of the meal (ISO string).")
});

const AnalyzeFoodMoodCorrelationInputSchema = z.object({
  mealsWithMood: z.array(MealWithMoodSchema).min(5).describe("An array of recent meal entries, each potentially having an associated mood. A minimum of 5 entries with mood data is recommended for meaningful analysis."),
  // userProfile: z.any().optional().describe("User's profile for context, e.g., stress levels, sleep patterns (if available).")
});
export type AnalyzeFoodMoodCorrelationInput = z.infer<typeof AnalyzeFoodMoodCorrelationInputSchema>;

const AnalyzeFoodMoodCorrelationOutputSchema = z.object({
  insights: z.array(z.string()).describe("Concise textual insights about potential correlations between food intake and mood. E.g., ['Users often report feeling more energetic after meals rich in complex carbohydrates.', 'High-sugar lunches might be linked to afternoon slumps based on your logs.']."),
  sufficientData: z.boolean().describe("Indicates if there was enough data to provide meaningful insights.")
});
export type AnalyzeFoodMoodCorrelationOutput = z.infer<typeof AnalyzeFoodMoodCorrelationOutputSchema>;

export async function analyzeFoodMoodCorrelation(input: AnalyzeFoodMoodCorrelationInput): Promise<AnalyzeFoodMoodCorrelationOutput> {
  const mealsWithActualMoodData = input.mealsWithMood.filter(meal => meal.mood);
  if (mealsWithActualMoodData.length < 3) { // Need at least a few data points with mood
    return {
      insights: ["Log your mood after a few more meals to discover potential patterns with your diet!"],
      sufficientData: false,
    };
  }
  return analyzeFoodMoodCorrelationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeFoodMoodCorrelationPrompt',
  input: {schema: AnalyzeFoodMoodCorrelationInputSchema},
  output: {schema: AnalyzeFoodMoodCorrelationOutputSchema},
  prompt: `You are a data analyst specializing in nutrition and wellbeing.
Analyze the provided list of user's meals and their logged moods. Identify potential (correlational, not causal) patterns or insights.

Meals and Moods Data:
{{#each mealsWithMood}}
- Meal on {{this.date}}: {{this.description | default:"A meal"}} ({{this.calories}} kcal, P:{{this.protein}}g, C:{{this.carbs}}g, F:{{this.fat}}g)
  {{#if this.mood}}Logged Mood: {{this.mood}}{{else}}Mood not logged{{/if}}
{{/each}}

Consider factors like:
- Types of food (e.g., high-sugar, high-fiber, plant-based).
- Macronutrient composition.
- Timing of meals vs. mood (though precise timing analysis is hard, look for general trends).

Provide 1-2 concise insights. Examples:
- "It appears you tend to log a 'happy' mood after meals containing fresh fruits or vegetables."
- "Some of your 'sad' or 'neutral' moods are logged after lunches with high simple carbohydrate content. This might lead to an energy dip."
- "Plant-based dinners seem to correlate with 'neutral' or 'happy' moods the next morning (if such data were available)."

If the data is too sparse or moods are not varied enough, state that more data is needed for strong conclusions.
Return an array of insights and a boolean 'sufficientData'.
`,
});

const analyzeFoodMoodCorrelationFlow = ai.defineFlow(
  {
    name: 'analyzeFoodMoodCorrelationFlow',
    inputSchema: AnalyzeFoodMoodCorrelationInputSchema,
    outputSchema: AnalyzeFoodMoodCorrelationOutputSchema,
  },
  async (input: AnalyzeFoodMoodCorrelationInput) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI did not return food-mood correlation insights.");
    }
    return {
        insights: output.insights || ["Could not determine specific patterns from the current data. Try logging moods more consistently."],
        sufficientData: output.sufficientData !== undefined ? output.sufficientData : (output.insights && output.insights.length > 0)
    };
  }
);
