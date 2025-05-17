
'use server';
/**
 * @fileOverview Provides personalized AI coaching recommendations based on user profile and recent meals.
 *
 * - getAICoachRecommendations - A function that returns coaching tips.
 * - GetAICoachRecommendationsInput - The input type.
 * - GetAICoachRecommendationsOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Assuming UserProfile and MealEntry types/schemas would be imported or defined consistently
// For this example, simplified schemas are used.
const UserProfileSchema = z.object({
    name: z.string().optional(),
    age: z.string().optional(),
    gender: z.string().optional(),
    activityLevel: z.string().optional().describe("E.g., sedentary, light, moderate, very active"),
    healthGoals: z.array(z.string()).optional().describe("E.g., ['Lose Weight', 'Gain Muscle']"),
    dietType: z.string().optional().describe("E.g., vegetarian, vegan, none"),
});

const MealEntrySchema = z.object({
    description: z.string().optional(),
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
    date: z.string(), // ISO string for date
});

const GetAICoachRecommendationsInputSchema = z.object({
  userProfile: UserProfileSchema.describe("The user's profile information."),
  recentMeals: z.array(MealEntrySchema).optional().describe("An array of recent meal entries, e.g., last 7 days. Can be empty."),
});
export type GetAICoachRecommendationsInput = z.infer<typeof GetAICoachRecommendationsInputSchema>;

const GetAICoachRecommendationsOutputSchema = z.object({
  goalAdjustments: z.array(z.string()).describe("Suggestions for weekly goal adjustments, e.g., 'Consider increasing daily protein to 120g if your goal is muscle gain.'"),
  mealTimingSuggestions: z.array(z.string()).describe("Suggestions for meal timing, e.g., 'Try eating a carbohydrate-rich snack post-workout for better recovery.'"),
  generalTips: z.array(z.string()).optional().describe("Other general wellbeing or nutritional tips based on the profile and meals.")
});
export type GetAICoachRecommendationsOutput = z.infer<typeof GetAICoachRecommendationsOutputSchema>;

export async function getAICoachRecommendations(input: GetAICoachRecommendationsInput): Promise<GetAICoachRecommendationsOutput> {
  return getAICoachRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getAICoachRecommendationsPrompt',
  input: {schema: GetAICoachRecommendationsInputSchema},
  output: {schema: GetAICoachRecommendationsOutputSchema},
  prompt: `You are an AI Health and Nutrition Coach.
Based on the user's profile and their recent meal history (if available), provide:
1. One or two actionable weekly goal adjustments. These should be specific and tailored to their health goals and activity level.
2. One or two practical meal timing suggestions.
3. Optionally, one general wellbeing or nutritional tip.

User Profile:
- Health Goals: {{#if userProfile.healthGoals}} {{#each userProfile.healthGoals}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}} {{else}}Not specified{{/if}}
- Activity Level: {{#if userProfile.activityLevel}}{{userProfile.activityLevel}}{{else}}Not specified{{/if}}
- Diet Type: {{#if userProfile.dietType}}{{userProfile.dietType}}{{else}}Not specified{{/if}}

Recent Meals (if any):
{{#if recentMeals}}
{{#each recentMeals}}
- {{this.date}}: {{#if this.description}}{{this.description}}{{else}}Meal{{/if}} ({{this.calories}} kcal, P:{{this.protein}}g, C:{{this.carbs}}g, F:{{this.fat}}g)
{{/each}}
{{else}}
No recent meal data provided.
{{/if}}

Focus on positive and encouraging advice. If meal data is sparse, provide more general advice based on the profile. Ensure suggestions are distinct and cover different aspects if possible.
`,
});

const getAICoachRecommendationsFlow = ai.defineFlow(
  {
    name: 'getAICoachRecommendationsFlow',
    inputSchema: GetAICoachRecommendationsInputSchema,
    outputSchema: GetAICoachRecommendationsOutputSchema,
  },
  async (input: GetAICoachRecommendationsInput) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI coach did not return recommendations.");
    }
    // Ensure arrays are initialized if AI returns undefined for them
    return {
        goalAdjustments: output.goalAdjustments || [],
        mealTimingSuggestions: output.mealTimingSuggestions || [],
        generalTips: output.generalTips || []
    };
  }
);

