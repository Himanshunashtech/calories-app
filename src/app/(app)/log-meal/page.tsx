
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { analyzeFoodPhoto, type AnalyzeFoodPhotoOutput } from '@/ai/flows/analyze-food-photo';
import { autoLogMacros, type AutoLogMacrosOutput } from '@/ai/flows/auto-log-macros';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addMealLog, getSelectedPlan, canUseAIScan, incrementAIScanCount, getAIScanUsage, type UserPlan } from '@/lib/localStorage';
import type { FoodAnalysisResult, DetailedNutrients, MealCategory } from '@/types'; 
import { UploadCloud, Sparkles, Utensils, Loader2, Leaf, AlertCircle, Info, Camera as CameraIcon, RefreshCcw, ListPlus, ScanBarcode, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';

interface ExtendedAnalysisResult extends FoodAnalysisResult {
  carbonFootprintEstimate?: number;
}

export default function LogMealPage() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [mealCategory, setMealCategory] = useState<MealCategory | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ExtendedAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const [isClient, setIsClient] = useState(false);
  const [aiScansRemaining, setAiScansRemaining] = useState(0);
  const [showWatermark, setShowWatermark] = useState(false);

  const [isCameraMode, setIsCameraMode] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
    const plan = getSelectedPlan();
    setUserPlan(plan);
    if (plan === 'free') {
      const usage = getAIScanUsage();
      setAiScansRemaining(usage.limit - usage.count);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (isCameraMode) setIsCameraMode(false); 
      setShowWatermark(false);
    }
  }, [photoFile, isCameraMode]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const enableCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              if (err.name === "AbortError") {
                console.warn("Video play() request was interrupted (AbortError).", err);
              } else {
                console.error("Video play failed:", err);
              }
            });
          }
        }
      } catch (err: any) {
        console.error('Error accessing camera:', err);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: `Please enable camera permissions in your browser settings. (${err.name})`,
        });
      }
    };

    const disableCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };

    if (isCameraMode && hasCameraPermission !== false && !photoPreview) {
      enableCamera();
    } else {
      disableCamera();
    }

    return () => { 
      disableCamera();
    };
  }, [isCameraMode, hasCameraPermission, photoPreview, toast]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file); 
      setPhotoPreview(null); 
      setAnalysisResult(null); 
      setError(null);
      setIsCameraMode(false); 
      setShowWatermark(false);
    }
  };
  
  const handleCapturePhoto = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState >= videoRef.current.HAVE_METADATA) { 
        const canvas = document.createElement('canvas');
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;

        if (videoWidth === 0 || videoHeight === 0) {
            toast({ variant: "destructive", title: "Capture Error", description: "Could not get video dimensions."});
            return;
        }
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUri = canvas.toDataURL('image/jpeg');
            setPhotoPreview(dataUri);
            setPhotoFile(null); 
            setAnalysisResult(null);
            setError(null);
            setShowWatermark(false);
            setIsCameraMode(false); // Exit camera mode after capture
        }
    } else {
        toast({ variant: "destructive", title: "Camera Not Ready", description: "Wait for camera to initialize."});
    }
  }, [videoRef, toast]);

  const handleAnalyzeMeal = async () => {
    if (!photoPreview) {
      setError('Please upload or capture a photo.');
      toast({ variant: "destructive", title: "No Photo", description: "Provide a photo to analyze." });
      return;
    }

    if (userPlan === 'free' && !canUseAIScan(userPlan)) {
      toast({ variant: "destructive", title: "AI Scan Limit Reached", description: "Upgrade to Pro for unlimited scans." });
      setError('AI Scan limit reached for free plan.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setShowWatermark(false);

    try {
      const photoDataUri = photoPreview; 

      const [foodDetails, macroDetails] = await Promise.all([
        analyzeFoodPhoto({ photoDataUri }),
        autoLogMacros({ photoDataUri, description: description || 'A meal' })
      ]);
      
      setAnalysisResult({
        estimatedCalories: foodDetails.estimatedCalories,
        nutritionalInformation: foodDetails.nutritionalInformation,
        detailedNutrients: foodDetails.detailedNutrients,
        carbohydrates: macroDetails.carbohydrates,
        fats: macroDetails.fats,
        proteins: macroDetails.proteins,
        carbonFootprintEstimate: macroDetails.carbonFootprintEstimate,
      });

      if (userPlan === 'free') {
        incrementAIScanCount();
        const usage = getAIScanUsage(); 
        setAiScansRemaining(usage.limit - usage.count);
        setShowWatermark(true);
        toast({
          title: "AI Scan Used (Free Tier)",
          description: `You have ${usage.limit - usage.count} free scans remaining. Results watermarked.`,
          action: <Info className="h-5 w-5 text-blue-500" />
        });
      }

    } catch (err) {
      console.error('AI analysis failed:', err);
      setError('Failed to analyze meal. Please try again.');
      toast({ variant: "destructive", title: "Analysis Error", description: "Could not analyze meal photo." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogMeal = () => {
    if (!analysisResult) {
      toast({ variant: "destructive", title: "Cannot Log Meal", description: "Please analyze the meal first." });
      return;
    }
    if (!mealCategory) {
      toast({ variant: "destructive", title: "Cannot Log Meal", description: "Please select a meal category." });
      return;
    }


    addMealLog({
      // photoDataUri: photoPreview || undefined, // Redundant if image is already part of `analysisResult` potentially
      photoDataUri: photoPreview || undefined, // Keep photoPreview for the log entry
      description: description,
      category: mealCategory,
      calories: analysisResult.estimatedCalories,
      protein: analysisResult.proteins,
      carbs: analysisResult.carbohydrates,
      fat: analysisResult.fats,
      nutritionalInfo: analysisResult.nutritionalInformation,
      detailedNutrients: analysisResult.detailedNutrients,
      carbonFootprintEstimate: analysisResult.carbonFootprintEstimate,
    });

    toast({
      title: "Meal Logged!",
      description: `${mealCategory}: ${analysisResult.estimatedCalories} kcal added.`,
      action: <Leaf className="h-5 w-5 text-green-500" />,
    });

    resetForm();
  };
  
  const resetForm = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setDescription('');
    setMealCategory(undefined);
    setAnalysisResult(null);
    setError(null);
    setIsLoading(false);
    setShowWatermark(false);
    setIsCameraMode(false); // Reset camera mode
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleToggleCameraMode = () => {
    setIsCameraMode(prev => {
      const newMode = !prev;
      if (newMode) { 
        setPhotoFile(null); 
        setPhotoPreview(null); 
        setHasCameraPermission(null); // Reset permission check to trigger useEffect
      } else { 
         if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
         }
         if(videoRef.current) videoRef.current.srcObject = null;
      }
      return newMode;
    });
    setAnalysisResult(null);
    setError(null);
    setShowWatermark(false);
  };

  const handleRetakePhoto = () => {
    setPhotoPreview(null); 
    setAnalysisResult(null);
    setError(null);
    setShowWatermark(false);
    setIsCameraMode(true); // Re-enter camera mode
    setHasCameraPermission(null); // Re-trigger camera permission check
  };
  
  const handlePlaceholderFeatureClick = (featureName: string) => {
    toast({
      title: `${featureName} Coming Soon!`,
      description: `This feature will be available in a future update.`,
    });
  };

  const canAnalyze = isClient && (userPlan !== 'free' || (userPlan === 'free' && aiScansRemaining > 0));
  const mealCategories: MealCategory[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Utensils className="h-7 w-7 text-primary" />
              Log Your Meal
            </CardTitle>
            <Button variant="outline" onClick={handleToggleCameraMode} size="sm">
              {isCameraMode ? <UploadCloud className="mr-2 h-4 w-4"/> : <CameraIcon className="mr-2 h-4 w-4"/>}
              {isCameraMode ? 'Upload File' : 'Use Camera'}
            </Button>
          </div>
          <CardDescription>
            {isCameraMode ? "Use your camera to take a photo." : "Upload a photo for EcoAI to analyze or enter details manually."}
            {isClient && userPlan === 'free' && (
              <span className="block text-xs mt-1">
                {aiScansRemaining > 0 ? `${aiScansRemaining} AI scans remaining.` : "No AI scans remaining."} Results watermarked for free tier.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isCameraMode ? (
            <div className="space-y-4">
              <div className="relative w-full aspect-[4/3] bg-muted rounded-md overflow-hidden border">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline />
                 {!photoPreview && hasCameraPermission === null && !videoRef.current?.srcObject && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/50"> <Loader2 className="h-8 w-8 animate-spin text-primary"/> </div>
                )}
                {!photoPreview && hasCameraPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-4 z-20">
                        <Alert variant="destructive" className="max-w-sm">
                            <AlertCircle className="h-4 w-4" /> <AlertTitle>Camera Access Denied</AlertTitle>
                            <AlertDescription>Enable camera permissions & refresh.</AlertDescription>
                        </Alert>
                    </div>
                )}
              </div>
              {hasCameraPermission && !photoPreview && (
                <Button onClick={handleCapturePhoto} className="w-full" disabled={isLoading || hasCameraPermission === false}>
                    <CameraIcon className="mr-2 h-5 w-5"/> Capture Photo
                </Button>
              )}
              {photoPreview && (
                <Button onClick={handleRetakePhoto} variant="outline" className="w-full">
                  <RefreshCcw className="mr-2 h-5 w-5"/> Retake Photo
                </Button>
              )}
            </div>
          ) : photoPreview ? ( // Show preview if available (from upload or capture)
             <div className="relative group w-full aspect-[4/3] sm:w-64 sm:h-48 mx-auto">
                <Image
                    src={photoPreview}
                    alt="Meal preview"
                    fill
                    sizes="(max-width: 640px) 100vw, 256px"
                    style={{objectFit:"cover"}}
                    className="rounded-md shadow-md"
                />
                {showWatermark && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
                        <p className="text-white text-lg font-bold transform -rotate-12 opacity-75">Watermarked</p>
                    </div>
                )}
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 bg-background/50 hover:bg-background/80 z-20 h-8 w-8" onClick={() => {setPhotoFile(null); setPhotoPreview(null); setAnalysisResult(null); if(fileInputRef.current) fileInputRef.current.value = ""; setShowWatermark(false);}}>
                    <X className="h-4 w-4"/>
                </Button>
            </div>
          ) : ( // Default to file upload input
            <div>
              <Label htmlFor="meal-photo-input" className="text-base sr-only">Meal Photo Upload</Label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10 hover:border-primary transition-colors">
                <div className="text-center">
                     <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
                  <div className="mt-4 flex text-sm leading-6 text-muted-foreground justify-center">
                    <Label htmlFor="meal-photo-input" className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none hover:text-primary/80">
                      <span>Upload a file</span>
                      <Input id="meal-photo-input" ref={fileInputRef} name="meal-photo" type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                    </Label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="description" className="text-base">Description (Optional)</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Chicken salad with avocado" className="mt-2 min-h-[80px]" />
          </div>
          
          <div className="flex items-center gap-2">
            <Input placeholder="Search food item for manual entry..." className="flex-1" disabled />
            <Button variant="outline" size="icon" onClick={() => handlePlaceholderFeatureClick('Barcode Scanning')} aria-label="Scan Barcode">
                <ScanBarcode />
            </Button>
          </div>


          <div>
            <Label htmlFor="mealCategory" className="text-base">Category</Label>
            <Select value={mealCategory} onValueChange={(value) => setMealCategory(value as MealCategory)}>
              <SelectTrigger id="mealCategory" className="mt-2">
                <SelectValue placeholder="Select meal category" />
              </SelectTrigger>
              <SelectContent>
                {mealCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          {error && ( <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md"> <AlertCircle className="h-5 w-5"/> <span>{error}</span> </div> )}

          <Button onClick={handleAnalyzeMeal} disabled={!photoPreview || isLoading || !canAnalyze} className="w-full text-lg py-6">
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
            {isLoading ? 'Analyzing...' : (canAnalyze ? 'Analyze Meal with AI' : (isClient && userPlan ==='free' && aiScansRemaining <=0 ? 'AI Scan Limit Reached' : 'Analyze Meal with AI'))}
          </Button>
          {!canAnalyze && isClient && userPlan === 'free' && aiScansRemaining <= 0 && (
            <p className="text-xs text-center text-muted-foreground mt-2">Upgrade for unlimited AI scans.</p>
          )}
        </CardContent>
      </Card>

      {analysisResult && (
        <Card className="shadow-lg animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl"> <Leaf className="h-7 w-7 text-primary" /> AI Analysis Results </CardTitle>
             {showWatermark && ( <CardDescription className="text-xs text-amber-600">Note: Results are watermarked for free tier.</CardDescription> )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-primary text-center"> {analysisResult.estimatedCalories.toFixed(0)} kcal </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div> <p className="text-sm text-muted-foreground">Protein</p> <p className="text-lg font-medium">{analysisResult.proteins.toFixed(1)}g</p> </div>
              <div> <p className="text-sm text-muted-foreground">Carbs</p> <p className="text-lg font-medium">{analysisResult.carbohydrates.toFixed(1)}g</p> </div>
              <div> <p className="text-sm text-muted-foreground">Fat</p> <p className="text-lg font-medium">{analysisResult.fats.toFixed(1)}g</p> </div>
            </div>
            {analysisResult.carbonFootprintEstimate !== undefined && (userPlan === 'pro' || userPlan === 'ecopro') && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Est. Carbon Footprint</p>
                <p className="text-lg font-medium">{analysisResult.carbonFootprintEstimate.toFixed(2)} kg CO₂e</p>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-base">General Nutritional Info:</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md mt-1">{analysisResult.nutritionalInformation}</p>
            </div>
            {analysisResult.detailedNutrients && Object.keys(analysisResult.detailedNutrients).length > 0 && (userPlan === 'pro' || userPlan === 'ecopro') && (
              <div>
                <h4 className="font-semibold text-base mt-3">Detailed Micronutrients:</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside pl-2 space-y-1 mt-1">
                  {Object.entries(analysisResult.detailedNutrients).map(([key, nutrient]) => nutrient && nutrient.value !== undefined && (
                    <li key={key} className="capitalize">{key}: {nutrient.value.toFixed(1)}{nutrient.unit}
                      {nutrient.rdaPercentage && ` (${nutrient.rdaPercentage.toFixed(0)}% RDA)`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button 
                onClick={handleLogMeal} 
                className="w-full whitespace-normal text-center sm:whitespace-nowrap" 
                size="lg" 
                disabled={!mealCategory}> 
                  <ListPlus className="mr-2 h-5 w-5" /> Log This Meal 
              </Button>
              <Button 
                onClick={resetForm} 
                className="w-full whitespace-normal text-center sm:whitespace-nowrap" 
                variant="outline" 
                size="lg"> 
                  Clear & Start New 
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

