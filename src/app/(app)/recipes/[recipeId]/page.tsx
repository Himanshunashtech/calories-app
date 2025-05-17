
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Leaf, Utensils, CheckSquare, Clock, ListPlus, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Placeholder recipe data - in a real app, this would come from a database or API
const placeholderRecipes = [
  { id: '1', name: 'Quinoa Salad with Roasted Vegetables', description: 'A light and healthy salad, perfect for lunch. Packed with nutrients and vibrant flavors.', ecoScore: 'A', dietTags: ['vegan', 'gluten-free'], image: 'https://placehold.co/600x400.png?text=Quinoa+Salad', dataAiHint: 'salad healthy', prepTime: '15 mins', cookTime: '25 mins', servings: 2, ingredients: ['1 cup quinoa', '1 bell pepper', '1 zucchini', '1 red onion', '2 tbsp olive oil', 'Salt & pepper', 'Lemon juice'], instructions: ['Cook quinoa according to package directions.', 'Chop vegetables and toss with olive oil, salt, and pepper.', 'Roast vegetables at 200°C (400°F) for 20-25 minutes.', 'Combine quinoa and roasted vegetables. Dress with lemon juice.'] },
  { id: '2', name: 'Lentil Soup', description: 'Hearty and nutritious lentil soup that warms you from the inside out.', ecoScore: 'A', dietTags: ['vegan', 'vegetarian'], image: 'https://placehold.co/600x400.png?text=Lentil+Soup', dataAiHint: 'soup lentil', prepTime: '10 mins', cookTime: '40 mins', servings: 4, ingredients: ['1 cup red lentils', '1 onion, chopped', '2 carrots, chopped', '2 celery stalks, chopped', '4 cups vegetable broth', '1 tsp cumin', 'Salt & pepper'], instructions: ['Sauté onion, carrots, and celery until softened.', 'Add lentils, broth, cumin, salt, and pepper.', 'Bring to a boil, then simmer for 30-40 minutes until lentils are tender.'] },
  { id: '3', name: 'Baked Salmon with Asparagus', description: 'Delicious and omega-3 rich baked salmon served with tender asparagus spears.', ecoScore: 'B', dietTags: ['pescatarian'], image: 'https://placehold.co/600x400.png?text=Baked+Salmon', dataAiHint: 'salmon fish', prepTime: '10 mins', cookTime: '15 mins', servings: 2, ingredients: ['2 salmon fillets', '1 bunch asparagus', '1 tbsp olive oil', 'Lemon wedges', 'Salt & pepper', 'Dill (optional)'], instructions: ['Preheat oven to 200°C (400°F).', 'Toss asparagus with olive oil, salt, and pepper. Season salmon fillets.', 'Place salmon and asparagus on a baking sheet. Bake for 12-15 minutes.', 'Serve with lemon wedges and fresh dill.'] },
];


export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [recipe, setRecipe] = useState<typeof placeholderRecipes[0] | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (params.recipeId) {
      const foundRecipe = placeholderRecipes.find(r => r.id === params.recipeId);
      setRecipe(foundRecipe || null);
    }
  }, [params.recipeId]);

  const handleLogMeal = () => {
    // Placeholder: In a real app, this would pre-fill the log meal page
    // or directly log the meal with its nutritional data (if available)
    if (recipe) {
      toast({
        title: `Meal Added to Log (Concept)`,
        description: `${recipe.name} would be added to your meal log.`,
      });
      router.push('/log-meal'); // Or pre-fill log meal page
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
           <div className="absolute top-2 right-2">
             <Button size="icon" variant="secondary" onClick={handleShare} aria-label="Share recipe">
                <Share2 className="h-5 w-5"/>
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

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 text-sm text-center">
            {recipe.prepTime && <div className="p-2 border rounded-md"><Clock3 className="mx-auto mb-1 h-5 w-5 text-primary"/><p className="font-medium">Prep Time</p><p className="text-muted-foreground">{recipe.prepTime}</p></div>}
            {recipe.cookTime && <div className="p-2 border rounded-md"><Clock3 className="mx-auto mb-1 h-5 w-5 text-primary"/><p className="font-medium">Cook Time</p><p className="text-muted-foreground">{recipe.cookTime}</p></div>}
            {recipe.servings && <div className="p-2 border rounded-md"><Utensils className="mx-auto mb-1 h-5 w-5 text-primary"/><p className="font-medium">Servings</p><p className="text-muted-foreground">{recipe.servings}</p></div>}
          </div>

          <section className="mb-6">
            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><ListPlus/>Ingredients</h3>
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
        <CardFooter className="p-4 md:p-6 border-t">
          <Button size="lg" className="w-full" onClick={handleLogMeal}>
            <ListPlus className="mr-2 h-5 w-5"/> Add to Meal Log (Concept)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
