
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Leaf, Utensils, CheckSquare, Clock, ListPlus, Share2, Sparkles, BarChartHorizontalBig, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addMealLog, type MealEntry, getUserProfile, type UserProfile } from '@/lib/localStorage';

// Placeholder recipe data - in a real app, this would come from a database or API
const placeholderRecipes = [
  { id: '1', name: 'Quinoa Salad with Roasted Vegetables', description: 'A light and healthy salad, perfect for lunch. Packed with nutrients and vibrant flavors.', ecoScore: 'A', dietTags: ['vegan', 'gluten-free'], image: 'https://placehold.co/600x400.png?text=Quinoa+Salad', dataAiHint: 'salad healthy', prepTime: '15 mins', cookTime: '25 mins', servings: 2, calories: 350, protein: 12, carbs: 45, fat: 15, ingredients: ['1 cup quinoa, cooked', '1 bell pepper, chopped', '1 zucchini, chopped', '1 red onion, chopped', '1/2 cup cherry tomatoes, halved', '2 tbsp olive oil', '1 tbsp lemon juice', 'Salt & pepper to taste', 'Optional: Feta cheese or chickpeas for protein'], instructions: ['Preheat oven to 200°C (400°F).', 'Toss chopped vegetables (bell pepper, zucchini, red onion) with 1 tbsp olive oil, salt, and pepper.', 'Roast vegetables for 20-25 minutes, or until tender and slightly caramelized.', 'In a large bowl, combine cooked quinoa, roasted vegetables, and cherry tomatoes.', 'Whisk together remaining 1 tbsp olive oil and lemon juice. Pour over salad and toss to combine.', 'Season with additional salt and pepper if needed. Serve warm or cold. Add feta or chickpeas if desired.'] },
  { id: '2', name: 'Lentil Soup', description: 'Hearty and nutritious lentil soup that warms you from the inside out.', ecoScore: 'A', dietTags: ['vegan', 'vegetarian'], image: 'https://placehold.co/600x400.png?text=Lentil+Soup', dataAiHint: 'soup lentil', prepTime: '10 mins', cookTime: '40 mins', servings: 4, calories: 250, protein: 15, carbs: 35, fat: 5, ingredients: ['1 cup red lentils, rinsed', '1 onion, chopped', '2 carrots, chopped', '2 celery stalks, chopped', '4 cups vegetable broth', '2 cloves garlic, minced', '1 tsp cumin', '1/2 tsp turmeric', 'Salt & pepper to taste', 'Fresh parsley for garnish'], instructions: ['In a large pot or Dutch oven, sauté onion, carrots, and celery over medium heat until softened, about 5-7 minutes.', 'Add garlic, cumin, and turmeric. Cook for 1 minute more, stirring constantly.', 'Stir in rinsed lentils and vegetable broth. Bring to a boil.', 'Reduce heat and simmer for 30-40 minutes, or until lentils are tender. Stir occasionally.', 'Season with salt and pepper to taste. Serve hot, garnished with fresh parsley.'] },
  { id: '3', name: 'Baked Salmon with Asparagus', description: 'Delicious and omega-3 rich baked salmon served with tender asparagus spears.', ecoScore: 'B', dietTags: ['pescatarian', 'fish'], image: 'https://placehold.co/600x400.png?text=Baked+Salmon', dataAiHint: 'salmon fish', prepTime: '10 mins', cookTime: '15 mins', servings: 2, calories: 450, protein: 40, carbs: 10, fat: 28, ingredients: ['2 salmon fillets (6oz each)', '1 bunch asparagus, trimmed', '1 tbsp olive oil', '2 lemon wedges', 'Salt & pepper to taste', '1/2 tsp dried dill (optional)'], instructions: ['Preheat oven to 200°C (400°F). Line a baking sheet with parchment paper.', 'Toss asparagus with 1/2 tbsp olive oil, salt, and pepper. Spread on one side of the baking sheet.', 'Pat salmon fillets dry. Drizzle with remaining olive oil, season with salt, pepper, and dill (if using). Place on the other side of the baking sheet.', 'Bake for 12-15 minutes, or until salmon is cooked through and asparagus is tender-crisp.', 'Serve immediately with lemon wedges.'] },
  { id: '4', name: 'Mushroom Risotto', description: 'Creamy and comforting mushroom risotto.', ecoScore: 'B', dietTags: ['vegetarian', 'gluten-free', 'dairy'], image: 'https://placehold.co/300x200.png?text=Mushroom+Risotto', dataAiHint: 'risotto mushroom', prepTime: '15 mins', cookTime: '30 mins', servings: 3, calories: 400, protein: 10, carbs: 50, fat: 18, ingredients:['1 tbsp olive oil', '1 shallot, finely chopped', '8 oz mixed mushrooms, sliced', '1 cup Arborio rice', '1/2 cup dry white wine (optional)', '4 cups hot vegetable broth', '1/4 cup grated Parmesan cheese', '1 tbsp butter', 'Salt and pepper to taste', 'Fresh parsley, chopped'], instructions:['Heat olive oil in a large pan. Add shallot and cook until softened. Add mushrooms and cook until browned.', 'Add Arborio rice and toast for 1-2 minutes, stirring constantly.', 'If using, pour in white wine and cook until absorbed.', 'Add a ladleful of hot broth to the rice, stirring until absorbed. Continue adding broth, one ladleful at a time, waiting until each is absorbed before adding the next. This should take about 18-20 minutes.', 'Once rice is creamy and al dente, stir in Parmesan cheese and butter. Season with salt and pepper.', 'Serve immediately, garnished with fresh parsley.'] },
  { id: '5', name: 'Chickpea Curry', description: 'Flavorful and satisfying chickpea curry.', ecoScore: 'A', dietTags: ['vegan', 'vegetarian'], image: 'https://placehold.co/300x200.png?text=Chickpea+Curry', dataAiHint: 'curry chickpea', prepTime: '10 mins', cookTime: '25 mins', servings: 4, calories: 380, protein: 14, carbs: 55, fat: 12, ingredients:['1 tbsp coconut oil', '1 onion, chopped', '2 cloves garlic, minced', '1 inch ginger, grated', '1 tbsp curry powder', '1 tsp turmeric', '1 (14.5 oz) can diced tomatoes', '1 (15 oz) can chickpeas, rinsed and drained', '1 (13.5 oz) can full-fat coconut milk', 'Fresh spinach (2 cups, optional)', 'Salt to taste', 'Cooked rice or naan, for serving'], instructions:['Heat coconut oil in a large skillet. Add onion and cook until softened, about 5 minutes.', 'Add garlic and ginger, cook for 1 minute. Stir in curry powder and turmeric, cook for 30 seconds.', 'Add diced tomatoes, chickpeas, and coconut milk. Bring to a simmer.', 'Reduce heat and cook for 15-20 minutes, allowing flavors to meld. If using spinach, stir it in during the last few minutes until wilted.', 'Season with salt. Serve hot with rice or naan.'] },
  { id: '6', name: 'Avocado Toast Deluxe', description: 'Classic avocado toast with a twist.', ecoScore: 'A', dietTags: ['vegetarian', 'vegan', 'gluten'], image: 'https://placehold.co/300x200.png?text=Avocado+Toast', dataAiHint: 'avocado toast', prepTime: '5 mins', cookTime: '5 mins', servings: 1, calories: 300, protein: 8, carbs: 30, fat: 18, ingredients:['1 slice whole-grain bread, toasted', '1/2 ripe avocado', '1 tsp lemon juice', 'Salt and pepper to taste', 'Red pepper flakes (optional)', 'Everything bagel seasoning (optional)'], instructions:['Mash avocado with lemon juice, salt, and pepper.', 'Spread avocado mixture on toasted bread.', 'Sprinkle with red pepper flakes and/or everything bagel seasoning, if desired.'] },
  { id: '7', name: 'Beyond Burger Bowl', description: 'A plant-based burger experience in a bowl.', ecoScore: 'B', dietTags: ['vegan', 'soy'], image: 'https://placehold.co/300x200.png?text=Burger+Bowl', dataAiHint: 'burger plant-based', prepTime: '15 mins', cookTime: '10 mins', servings: 2, calories: 500, protein: 25, carbs: 40, fat: 25, ingredients:['2 Beyond Meat patties', '1 cup cooked quinoa or brown rice', 'Mixed greens', 'Cherry tomatoes, halved', 'Cucumber, sliced', 'Pickled onions', 'Vegan burger sauce (e.g., mayo, ketchup, relish mix)'], instructions:['Cook Beyond Meat patties according to package directions. Crumble or slice once cooked.', 'Assemble bowls: Start with a base of mixed greens and quinoa/rice.', 'Top with cooked Beyond Meat, cherry tomatoes, cucumber, and pickled onions.', 'Drizzle with vegan burger sauce.'] },
  { id: '8', name: 'Keto Chicken Stir-fry', description: 'Low-carb and high-protein chicken stir-fry.', ecoScore: 'C', dietTags: ['keto', 'soy'], image: 'https://placehold.co/300x200.png?text=Keto+Stirfry', dataAiHint: 'keto chicken', prepTime: '15 mins', cookTime: '15 mins', servings: 2, calories: 420, protein: 45, carbs: 10, fat: 22, ingredients:['1 lb boneless, skinless chicken breast, cut into strips', '1 tbsp coconut oil or avocado oil', '1 head broccoli, cut into florets', '1 red bell pepper, sliced', '1/4 cup soy sauce or tamari (for gluten-free)', '1 tbsp sesame oil', '1 tsp grated ginger', '2 cloves garlic, minced', 'Optional: Sesame seeds for garnish'], instructions:['In a small bowl, whisk together soy sauce, sesame oil, ginger, and garlic.', 'Heat oil in a large skillet or wok over medium-high heat. Add chicken and cook until browned and cooked through.', 'Add broccoli and bell pepper. Stir-fry for 3-5 minutes until tender-crisp.', 'Pour sauce over chicken and vegetables. Cook for another 1-2 minutes, until sauce has thickened slightly.', 'Serve immediately, garnished with sesame seeds if desired.'] },
  { id: '9', name: 'Vegan Tofu Scramble', description: 'A hearty and protein-packed breakfast alternative.', ecoScore: 'A', dietTags: ['vegan', 'gluten-free', 'soy'], image: 'https://placehold.co/300x200.png?text=Tofu+Scramble', dataAiHint: 'tofu breakfast', prepTime: '5 mins', cookTime: '10 mins', servings: 2, calories: 280, protein: 20, carbs: 10, fat: 18, ingredients:['1 block (14 oz) firm or extra-firm tofu, pressed', '1 tbsp nutritional yeast', '1/2 tsp turmeric powder', '1/4 tsp black salt (kala namak, optional, for eggy flavor)', 'Salt and pepper to taste', '1 tbsp olive oil', '1/2 onion, chopped (optional)', '1/2 bell pepper, chopped (optional)', 'Handful of spinach (optional)'], instructions:['Crumble tofu into a bowl. Add nutritional yeast, turmeric, black salt (if using), salt, and pepper. Mix well.', 'Heat olive oil in a non-stick skillet over medium heat. If using onion and bell pepper, sauté until softened.', 'Add crumbled tofu mixture to the skillet. Cook, stirring occasionally, for 5-7 minutes until heated through and slightly browned.', 'If using spinach, stir it in during the last minute of cooking until wilted.', 'Serve hot.'] },
  { id: '10', name: 'Mediterranean Chickpea Salad', description: 'Refreshing and full of Mediterranean flavors.', ecoScore: 'A', dietTags: ['vegetarian', 'vegan', 'gluten-free'], image: 'https://placehold.co/300x200.png?text=Chickpea+Salad', dataAiHint: 'salad mediterranean', prepTime: '15 mins', cookTime: '0 mins', servings: 4, calories: 320, protein: 12, carbs: 40, fat: 14, ingredients:['2 (15 oz) cans chickpeas, rinsed and drained', '1 English cucumber, diced', '1 pint cherry tomatoes, halved', '1/2 red onion, thinly sliced', '1/2 cup Kalamata olives, halved', '1/4 cup fresh parsley, chopped', 'For the Vinaigrette:', '1/4 cup olive oil', '2 tbsp red wine vinegar', '1 tbsp lemon juice', '1 clove garlic, minced', '1/2 tsp dried oregano', 'Salt and pepper to taste'], instructions:['In a large bowl, combine chickpeas, cucumber, cherry tomatoes, red onion, olives, and parsley.', 'In a small bowl or jar, whisk together all vinaigrette ingredients: olive oil, red wine vinegar, lemon juice, minced garlic, oregano, salt, and pepper.', 'Pour vinaigrette over the salad and toss gently to combine.', 'Let the salad sit for at least 10-15 minutes to allow flavors to meld before serving. Can be made ahead and stored in the refrigerator.'] },
];


export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [recipe, setRecipe] = useState<typeof placeholderRecipes[0] | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setUserProfile(getUserProfile());
    if (params.recipeId) {
      const allRecipes = placeholderRecipes;
      const foundRecipe = allRecipes.find(r => r.id === params.recipeId);
      setRecipe(foundRecipe || null);
    }
  }, [params.recipeId]);

  const handleLogMeal = () => {
    if (recipe) {
      addMealLog({
        category: 'Snack', // Default or let user choose from a modal
        description: recipe.name,
        calories: recipe.calories || 0,
        protein: recipe.protein || 0,
        carbs: recipe.carbs || 0,
        fat: recipe.fat || 0,
        nutritionalInfo: recipe.description,
        photoDataUri: recipe.image.startsWith('https://placehold.co') ? undefined : recipe.image,
        carbonFootprintEstimate: recipe.ecoScore === 'A' ? 0.5 : recipe.ecoScore === 'B' ? 1.0 : 1.5 
      });
      toast({
        title: `Meal Logged!`,
        description: `${recipe.name} added to your meal log.`,
         action: <ListPlus className="text-green-500" />
      });
      router.push('/dashboard'); 
    }
  };
  
  const handleShare = () => {
     if (recipe && navigator.share) {
      navigator.share({
        title: recipe.name,
        text: `Check out this delicious recipe: ${recipe.name}`,
        url: window.location.href,
      })
      .then(() => toast({ title: 'Recipe Shared!' }))
      .catch((error) => toast({ variant: 'destructive', title: 'Share Failed', description: error.message }));
    } else if (recipe) {
        navigator.clipboard.writeText(window.location.href)
            .then(() => toast({ title: 'Link Copied!', description: 'Recipe link copied to clipboard.' }))
            .catch(() => toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy link.'}));
    }
  }
  
  const handlePrintRecipe = () => {
    if (typeof window !== 'undefined') {
        window.print();
    }
  }

  const handlePlaceholderFeatureClick = (featureName: string) => {
    toast({
      title: `${featureName} Coming Soon!`,
      description: `This feature will be available in a future update.`,
    });
  };


  if (!isClient || !recipe) {
    return (
      <div className="space-y-6 p-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Recipes</Button>
        <Card className="shadow-xl">
          <CardHeader>
            <div className="h-8 w-3/4 bg-muted rounded animate-pulse mb-2"></div>
            <div className="h-6 w-1/2 bg-muted rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full bg-muted rounded animate-pulse mb-6"></div>
            <div className="h-4 w-full bg-muted rounded animate-pulse mb-2"></div>
            <div className="h-4 w-5/6 bg-muted rounded animate-pulse mb-2"></div>
            <div className="h-4 w-4/6 bg-muted rounded animate-pulse mb-6"></div>
            <div className="h-6 w-1/3 bg-muted rounded animate-pulse mb-2"></div>
            <div className="h-4 w-full bg-muted rounded animate-pulse mb-1"></div>
            <div className="h-4 w-full bg-muted rounded animate-pulse mb-1"></div>
            <div className="h-4 w-2/3 bg-muted rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-0 sm:mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Recipes
      </Button>
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="p-0 relative">
          <Image 
            src={recipe.image} 
            alt={recipe.name} 
            width={800} 
            height={400} 
            className="w-full h-48 sm:h-64 md:h-80 object-cover"
            data-ai-hint={recipe.dataAiHint} 
            priority
          />
           <div className="absolute top-2 right-2 flex gap-2">
             <Button size="icon" variant="secondary" onClick={handleShare} aria-label="Share recipe">
                <Share2 className="h-5 w-5"/>
             </Button>
              <Button size="icon" variant="secondary" onClick={handlePrintRecipe} aria-label="Print recipe">
                <Printer className="h-5 w-5"/>
             </Button>
           </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <CardTitle className="text-2xl md:text-3xl font-bold mb-2 text-primary">{recipe.name}</CardTitle>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant={recipe.ecoScore === 'A' ? 'default' : 'secondary'} className={recipe.ecoScore === 'A' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}>
              <Leaf className="mr-1 h-3 w-3" /> Eco-Score: {recipe.ecoScore}
            </Badge>
            {recipe.dietTags.map(tag => <Badge key={tag} variant="outline" className="capitalize text-xs">{tag}</Badge>)}
          </div>
          <CardDescription className="text-base text-muted-foreground mb-6">{recipe.description}</CardDescription>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-sm text-center">
            {recipe.prepTime && <div className="p-2 border rounded-md"><Clock className="mx-auto mb-1 h-5 w-5 text-primary"/><p className="font-medium">Prep Time</p><p className="text-muted-foreground">{recipe.prepTime}</p></div>}
            {recipe.cookTime && <div className="p-2 border rounded-md"><Clock className="mx-auto mb-1 h-5 w-5 text-primary"/><p className="font-medium">Cook Time</p><p className="text-muted-foreground">{recipe.cookTime}</p></div>}
            {recipe.servings && <div className="p-2 border rounded-md"><Utensils className="mx-auto mb-1 h-5 w-5 text-primary"/><p className="font-medium">Servings</p><p className="text-muted-foreground">{recipe.servings}</p></div>}
            {recipe.calories && <div className="p-2 border rounded-md"><BarChartHorizontalBig className="mx-auto mb-1 h-5 w-5 text-primary"/><p className="font-medium">Calories</p><p className="text-muted-foreground">~{recipe.calories}/serving</p></div>}
          </div>

          <section className="mb-6">
            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><ListPlus/>Ingredients ({recipe.servings} servings)</h3>
            <ul className="list-disc list-inside pl-2 space-y-1 text-muted-foreground bg-muted/30 p-3 rounded-md">
              {recipe.ingredients.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><CheckSquare/>Instructions</h3>
            <ol className="list-decimal list-inside pl-2 space-y-2 text-muted-foreground">
              {recipe.instructions.map((step, index) => <li key={index} className="leading-relaxed">{step}</li>)}
            </ol>
          </section>
        </CardContent>
        <CardFooter className="p-4 md:p-6 border-t flex flex-col sm:flex-row gap-2">
          <Button size="lg" className="w-full sm:flex-1" onClick={handleLogMeal}>
            <ListPlus className="mr-2 h-5 w-5"/> Log This Meal
          </Button>
           <Button size="lg" variant="outline" className="w-full sm:flex-1" onClick={() => handlePlaceholderFeatureClick('AI Nutrition Details')}>
            <Sparkles className="mr-2 h-5 w-5"/> AI Nutrition Details (Pro)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

