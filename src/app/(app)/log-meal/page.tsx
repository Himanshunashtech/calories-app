
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
import { useToast } from '@/hooks/use-toast';
import { addMealLog, getSelectedPlan, canUseAIScan, incrementAIScanCount, getAIScanUsage, type UserPlan } from '@/lib/localStorage';
import type { FoodAnalysisResult } from '@/types';
import { UploadCloud, Sparkles, Utensils, Loader2, Leaf, AlertCircle, Info, Camera as CameraIcon, RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  }, []);
  
  useEffect(() => {
    if (userPlan === 'free') {
      const usage = getAIScanUsage();
      setAiScansRemaining(usage.limit - usage.count);
    }
  }, [isLoading, userPlan]);

  // Effect for handling photo file selection
  useEffect(() => {
    if (photoFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(photoFile);
      if (isCameraMode) setIsCameraMode(false); // Switch out of camera mode if a file is chosen
    } else if (!isCameraMode && !photoPreview) { 
      // If not in camera mode and no file, clear preview
      // This condition is tricky, ensure it doesn't clear captured camera preview unintentionally
      // setPhotoPreview(null); // This might be too aggressive
    }
  }, [photoFile, isCameraMode]);

  // Effect for camera stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    const enableCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Video play failed:", e));
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
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

    return () => { // Cleanup
      disableCamera();
    };
  }, [isCameraMode, hasCameraPermission, photoPreview, toast]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file); // This will trigger the useEffect for photoFile
      setPhotoPreview(null); // Clear any existing preview (e.g., from camera)
      setAnalysisResult(null); 
      setError(null);
      setIsCameraMode(false); // Ensure we are in file upload mode
    }
  };
  
  const handleCapturePhoto = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement('canvas');
        // Ensure video dimensions are available
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;
        if (videoWidth === 0 || videoHeight === 0) {
            console.error("Video dimensions are zero, cannot capture photo.");
            toast({ variant: "destructive", title: "Capture Error", description: "Could not get video dimensions. Try again."});
            return;
        }
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUri = canvas.toDataURL('image/jpeg');
            setPhotoPreview(dataUri);
            setPhotoFile(null); // Clear selected file if any
            setAnalysisResult(null);
            setError(null);
        }
    } else {
        toast({ variant: "destructive", title: "Camera Not Ready", description: "Please wait for the camera to initialize."});
    }
  }, [videoRef, toast]);

  const handleAnalyzeMeal = async () => {
    if (!photoPreview) {
      setError('Please upload or capture a photo of your meal.');
      toast({
        variant: "destructive",
        title: "No Photo",
        description: "Please provide a photo to analyze.",
      });
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
        const usage = getAIScanUsage(); 
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsCameraMode(false);
    setHasCameraPermission(null); 
  };
  
  const handleToggleCameraMode = () => {
    setIsCameraMode(prev => {
      const newMode = !prev;
      if (newMode) { // Switching to camera mode
        setPhotoFile(null); // Clear any selected file
        setPhotoPreview(null); // Clear preview
        setHasCameraPermission(null); // Reset permission to allow re-check
      } else { // Switching to file upload mode
         if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
         }
         videoRef.current && (videoRef.current.srcObject = null);
      }
      return newMode;
    });
    setAnalysisResult(null);
    setError(null);
  };

  const handleRetakePhoto = () => {
    setPhotoPreview(null);
    setAnalysisResult(null);
    setError(null);
    // The useEffect for camera stream will re-enable the camera
    // if isCameraMode is true and hasCameraPermission is not false.
    // Ensure hasCameraPermission is not false or it won't re-enable.
    // If permission was denied, user has to change it in browser settings.
    // If it was null or true, it should try again.
    if(hasCameraPermission === false) {
      // If permanently denied, prompt user or guide them. For now, it just won't show the stream.
      toast({
        title: "Camera Access Denied",
        description: "Please enable camera permissions in your browser settings to retake.",
        variant: "destructive"
      });
    }
  };

  const canAnalyze = isClient && (userPlan !== 'free' || (userPlan === 'free' && aiScansRemaining > 0));

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
            {isCameraMode ? "Use your camera to take a photo of your meal." : "Upload a photo of your meal and let EcoAI analyze it for you."}
            {isClient && userPlan === 'free' && (
              <span className="block text-xs mt-1">
                {aiScansRemaining > 0 ? `${aiScansRemaining} AI scans remaining this month.` : "No AI scans remaining."} Results may be watermarked.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isCameraMode ? (
            <div className="space-y-4">
              <div className="relative w-full aspect-[4/3] bg-muted rounded-md overflow-hidden border">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                {photoPreview && (
                   <Image src={photoPreview} alt="Captured meal" layout="fill" objectFit="cover" className="absolute inset-0 z-10"/>
                )}
                 {!photoPreview && hasCameraPermission === null && !videoRef.current?.srcObject && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                    </div>
                )}
                {!photoPreview && hasCameraPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-4 z-20">
                        <Alert variant="destructive" className="max-w-sm">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Camera Access Denied</AlertTitle>
                            <AlertDescription>
                                Please enable camera permissions in your browser settings and refresh.
                            </AlertDescription>
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
                    <RefreshCcw className="mr-2 h-4 w-4"/> Retake Photo
                </Button>
              )}
            </div>
          ) : (
            <div>
              <Label htmlFor="meal-photo-input" className="text-base sr-only">Meal Photo Upload</Label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10 hover:border-primary transition-colors">
                <div className="text-center">
                  {photoPreview && photoFile && ( // Only show this preview if a file was uploaded
                    <div className="relative group">
                      <Image
                        src={photoPreview}
                        alt="Meal preview"
                        width={200}
                        height={200}
                        className="mx-auto h-48 w-auto rounded-md object-cover shadow-md"
                      />
                       <Button variant="ghost" size="sm" className="absolute top-1 right-1 bg-background/50 hover:bg-background/80" onClick={() => {setPhotoFile(null); setPhotoPreview(null); setAnalysisResult(null); if(fileInputRef.current) fileInputRef.current.value = "";}}>Clear</Button>
                    </div>
                  )}
                  {(!photoPreview || !photoFile) && ( // Show upload prompt if no file-based preview
                     <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
                  )}
                  <div className="mt-4 flex text-sm leading-6 text-muted-foreground justify-center">
                    <Label
                      htmlFor="meal-photo-input"
                      className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
                    >
                      <span>{photoFile ? 'Change photo' : 'Upload a file'}</span>
                      <Input id="meal-photo-input" ref={fileInputRef} name="meal-photo" type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                    </Label>
                    {!photoFile && <p className="pl-1">or drag and drop</p>}
                  </div>
                  {!photoFile && <p className="text-xs leading-5 text-muted-foreground">PNG, JPG, GIF up to 10MB</p>}
                </div>
              </div>
            </div>
          )}

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
            disabled={!photoPreview || isLoading || !canAnalyze}
            className="w-full text-lg py-6"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5" />
            )}
            {isLoading ? 'Analyzing...' : (canAnalyze ? 'Analyze Meal with AI' : (isClient && userPlan ==='free' && aiScansRemaining <=0 ? 'AI Scan Limit Reached' : 'Analyze Meal with AI'))}
          </Button>
          {!canAnalyze && isClient && userPlan === 'free' && aiScansRemaining <= 0 && (
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
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
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

