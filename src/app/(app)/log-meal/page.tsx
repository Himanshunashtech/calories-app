'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { analyzeFoodPhoto, type AnalyzeFoodPhotoOutput } from '@/ai/flows/analyze-food-photo';
import { autoLogMacros, type AutoLogMacrosOutput } from '@/ai/flows/auto-log-macros';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { addMealLog, getSelectedPlan, canUseAIScan, incrementAIScanCount, getAIScanUsage, type UserPlan } from '@/lib/localStorage';
import type { FoodAnalysisResult } from '@/types';
import { UploadCloud, Sparkles, Utensils, Loader2, Leaf, AlertCircle, Info } from 'lucide-react';

export default function LogMealPage() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const [isClient, setIsClient] = useState(false);
  const [aiScansRemaining, setAiScansRemaining] = useState(0);

  useEffect(() => {
    setIsClient(true);
    const plan = getSelectedPlan();
    setUserPlan(plan);
    if (plan === 'free') {
      const usage = getAIScanUsage();
      setAiScansRemaining(usage.limit - usage.count);
    }
  }, []);
  
  useEffect(() => {
    if (userPlan === 'free') {
      const usage = getAIScanUsage();
      setAiScansRemaining(usage.limit - usage.count);
    }
  }, [isLoading, userPlan]);


  useEffect(() => {
    if (photoFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(photoFile);
    } else {
      setPhotoPreview(null);
    }
  }, [photoFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setAnalysisResult(null); 
      setError(null);
    }
  };

  const handleAnalyzeMeal = async () => {
    if (!photoPreview) {
      setError('Please upload a photo of your meal.');
      return;
    }

    if (userPlan === 'free' && !canUseAIScan(userPlan)) {
      toast({
        variant: "destructive",
        title: "AI Scan Limit Reached",
        description: "You've used all your free AI scans for this month. Upgrade to Pro for unlimited scans.",
      });
      setError('AI Scan limit reached for free plan.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const photoDataUri = photoPreview; 

      const [foodDetails, macroDetails] = await Promise.all([
        analyzeFoodPhoto({ photoDataUri }),
        autoLogMacros({ photoDataUri, description: description || 'A meal' })
      ]);
      
      setAnalysisResult({
        estimatedCalories: foodDetails.estimatedCalories,
        nutritionalInformation: foodDetails.nutritionalInformation,
        carbohydrates: macroDetails.carbohydrates,
        fats: macroDetails.fats,
        proteins: macroDetails.proteins,
      });

      if (userPlan === 'free') {
        incrementAIScanCount();
        const usage = getAIScanUsage(); // update remaining count
        setAiScansRemaining(usage.limit - usage.count);
        toast({
          title: "AI Scan Used",
          description: `You have ${usage.limit - usage.count} free scans remaining this month. Results may be watermarked.`,
          action: <Info className="h-5 w-5 text-blue-500" />
        });
      }

    } catch (err) {
      console.error('AI analysis failed:', err);
      setError('Failed to analyze meal. Please try again.');
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: "Could not analyze the meal photo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogMeal = () => {
    if (!analysisResult) {
      toast({
        variant: "destructive",
        title: "Cannot Log Meal",
        description: "Please analyze the meal first.",
      });
      return;
    }

    addMealLog({
      photoDataUri: photoPreview || undefined,
      description: description,
      calories: analysisResult.estimatedCalories,
      protein: analysisResult.proteins,
      carbs: analysisResult.carbohydrates,
      fat: analysisResult.fats,
      nutritionalInfo: analysisResult.nutritionalInformation,
    });

    toast({
      title: "Meal Logged!",
      description: `${analysisResult.estimatedCalories} kcal added to your log.`,
      action: <Leaf className="h-5 w-5 text-green-500" />,
    });

    resetForm();
  };
  
  const resetForm = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setDescription('');
    setAnalysisResult(null);
    setError(null);
    setIsLoading(false);
    const fileInput = document.getElementById('meal-photo-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };
  
  const canAnalyze = isClient && (userPlan !== 'free' || (userPlan === 'free' && aiScansRemaining > 0));

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Utensils className="h-7 w-7 text-primary" />
            Log Your Meal
          </CardTitle>
          <CardDescription>
            Upload a photo of your meal and let EcoAI analyze it for you.
            {isClient && userPlan === 'free' && (
              <span className="block text-xs mt-1">
                {aiScansRemaining > 0 ? `${aiScansRemaining} AI scans remaining this month.` : "No AI scans remaining."} Results may be watermarked.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="meal-photo-input" className="text-base">Meal Photo</Label>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10 hover:border-primary transition-colors">
              <div className="text-center">
                {photoPreview ? (
                  <div className="relative group">
                    <Image
                      src={photoPreview}
                      alt="Meal preview"
                      width={200}
                      height={200}
                      className="mx-auto h-48 w-auto rounded-md object-cover shadow-md"
                    />
                     <Button variant="ghost" size="sm" className="absolute top-1 right-1 bg-background/50 hover:bg-background/80" onClick={() => {setPhotoFile(null); setPhotoPreview(null); setAnalysisResult(null);}}>Clear</Button>
                  </div>
                ) : (
                  <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
                )}
                <div className="mt-4 flex text-sm leading-6 text-muted-foreground justify-center">
                  <Label
                    htmlFor="meal-photo-input"
                    className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
                  >
                    <span>{photoFile ? 'Change photo' : 'Upload a file'}</span>
                    <Input id="meal-photo-input" name="meal-photo" type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                  </Label>
                  {!photoFile && <p className="pl-1">or drag and drop</p>}
                </div>
                {!photoFile && <p className="text-xs leading-5 text-muted-foreground">PNG, JPG, GIF up to 10MB</p>}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-base">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Chicken salad with avocado"
              className="mt-2 min-h-[80px]"
            />
          </div>

          {error && (
             <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                <AlertCircle className="h-5 w-5"/> 
                <span>{error}</span>
            </div>
          )}

          <Button
            onClick={handleAnalyzeMeal}
            disabled={!photoFile || isLoading || !canAnalyze}
            className="w-full text-lg py-6"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5" />
            )}
            {isLoading ? 'Analyzing...' : (canAnalyze ? 'Analyze Meal with AI' : 'AI Scan Limit Reached')}
          </Button>
          {!canAnalyze && isClient && userPlan === 'free' && (
            <p className="text-xs text-center text-muted-foreground mt-2">Upgrade to Pro or EcoPro for unlimited AI scans.</p>
          )}
        </CardContent>
      </Card>

      {analysisResult && (
        <Card className="shadow-lg animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Leaf className="h-7 w-7 text-primary" />
              AI Analysis Results
            </CardTitle>
             {isClient && userPlan === 'free' && (
              <CardDescription className="text-xs text-muted-foreground">Note: Results for free tier may be illustrative or watermarked.</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-primary text-center">
              {analysisResult.estimatedCalories.toFixed(0)} kcal
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Protein</p>
                <p className="text-lg font-medium">{analysisResult.proteins.toFixed(1)}g</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Carbs</p>
                <p className="text-lg font-medium">{analysisResult.carbohydrates.toFixed(1)}g</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fat</p>
                <p className="text-lg font-medium">{analysisResult.fats.toFixed(1)}g</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-base">Nutritional Information:</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md mt-1">{analysisResult.nutritionalInformation}</p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleLogMeal} className="w-full" size="lg">
                <Utensils className="mr-2 h-5 w-5" />
                Log This Meal
              </Button>
              <Button onClick={resetForm} className="w-full" variant="outline" size="lg">
                Clear & Start New
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
