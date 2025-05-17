
'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Send, User, Sparkles, Loader2, MessageCircle, ShieldAlert, X, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatWithAICoach } from '@/ai/flows/chat-with-ai-coach';
import type { ChatMessage, FlowChatMessage } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, getSelectedPlan, type UserPlan } from '@/lib/localStorage'; 

export default function ChatPage() {
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [userName, setUserName] = useState<string>('User');
  const [userImage, setUserImage] = useState<string | null>(null);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  // States for voice typing
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [micDisabled, setMicDisabled] = useState(true); // Initially disabled until API support is checked


  useEffect(() => {
    const plan = getSelectedPlan();
    if (plan !== 'ecopro') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'The AI Chat Coach is an EcoPro feature. Please upgrade your plan to use the chat.',
        duration: 5000,
      });
      router.push('/subscription');
    } else {
      setIsAuthorized(true);
      const profile = getUserProfile();
      if (profile) {
        setUserName(profile.name || 'User');
        setUserImage(profile.profileImageUri || null);
      }
      if (chatHistory.length === 0) {
        setChatHistory([
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: "Hi there! I'm EcoAICoach. How can I help you with your nutrition, fitness, or using the app today?",
            timestamp: new Date().toISOString(),
          }
        ]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, toast]); 

  // Effect for SpeechRecognition setup
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const recognitionInstance = new SpeechRecognitionAPI();
      recognitionInstance.continuous = false; // Process single utterances
      recognitionInstance.interimResults = false; // We only care about the final result
      recognitionInstance.lang = 'en-US'; // Or make this configurable

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue((prev) => prev + transcript + ' '); // Append and add space
        setIsListening(false); // Stop listening after one result
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        let errorMessage = 'Speech recognition error. Please try again.';
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          errorMessage = 'Microphone access denied. Please enable it in your browser settings.';
        } else if (event.error === 'no-speech') {
          errorMessage = 'No speech detected. Please try again.';
        } else if (event.error === 'audio-capture') {
          errorMessage = 'Microphone not available or not working.';
        }
        toast({
          variant: 'destructive',
          title: 'Voice Input Error',
          description: errorMessage,
        });
        setIsListening(false); 
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognitionInstance;
      setMicDisabled(false); // Enable mic button if API is supported
    } else {
      console.warn('Speech Recognition API not supported in this browser.');
      setMicDisabled(true);
      // Optionally inform user that voice input is not available via toast, but can be noisy
    }

    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); // isListening removed from deps to avoid re-creating recognition object


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleToggleListening = async () => {
    if (!recognitionRef.current || micDisabled || isLoading) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        // Check permission by trying to get user media.
        // This also serves to prompt the user if permissions haven't been granted yet.
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsListening(true);
        recognitionRef.current.start();
      } catch (err) {
        console.error("Microphone permission error:", err);
        toast({
          variant: 'destructive',
          title: 'Microphone Access Required',
          description: 'Please enable microphone permissions in your browser settings to use voice input.',
        });
        setIsListening(false);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !isAuthorized) return;

    // If speech recognition is active, stop it before sending
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setChatHistory((prevHistory) => [...prevHistory, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const flowHistory: FlowChatMessage[] = chatHistory
      .slice(-10) 
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: msg.text,
      }));
    
    try {
      const result = await chatWithAICoach({
        userInput: userMessage.text, 
        chatHistory: flowHistory, 
      });

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: result.aiResponse,
        timestamp: new Date().toISOString(),
      };
      setChatHistory((prevHistory) => [...prevHistory, aiMessage]);
    } catch (error) {
      console.error('Error calling chat AI flow from client:', error);
      let desc = 'Could not get a response from the AI coach. Please try again.';
      if (error instanceof Error && error.message) {
          desc = error.message.includes("AI did not return") ? error.message : desc;
      }
      toast({
        variant: 'destructive',
        title: 'Chat Error',
        description: desc,
      });
       const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
      };
      setChatHistory((prevHistory) => [...prevHistory, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthorized && !isLoading) { // Added !isLoading to prevent flash of this content
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">The AI Chat Coach is an EcoPro exclusive feature.</p>
        <Button onClick={() => router.push('/subscription')}>View Subscription Plans</Button>
      </div>
    );
  }
  
  if (!isAuthorized && isLoading) { // Show loader if authorization check is in progress
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] flex flex-col shadow-xl border-primary/20">
      <CardHeader className="border-b flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-primary">
          <MessageCircle className="h-6 w-6" />
          Chat with EcoAI Coach
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Close chat">
          <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {chatHistory.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex items-end gap-2',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 border border-primary/50">
                    <AvatarFallback><Sparkles className="text-primary" /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-[70%] rounded-xl px-4 py-2.5 text-sm shadow-md',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted text-muted-foreground rounded-bl-none'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                   <p className={cn("text-xs mt-1", message.role === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground/70 text-left')}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                 {message.role === 'user' && (
                  <Avatar className="h-8 w-8 border">
                     {userImage ? <AvatarImage src={userImage} alt={userName} /> : null}
                    <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-end gap-2 justify-start">
                <Avatar className="h-8 w-8 border border-primary/50">
                  <AvatarFallback><Sparkles className="text-primary" /></AvatarFallback>
                </Avatar>
                <div className="max-w-[70%] rounded-xl px-4 py-3 text-sm shadow-md bg-muted text-muted-foreground rounded-bl-none">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
          <Input
            type="text"
            placeholder="Ask EcoAICoach anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 text-base"
            disabled={isLoading}
            autoFocus
          />
          <Button 
            type="button" 
            size="icon" 
            variant={isListening ? "destructive" : "outline"}
            onClick={handleToggleListening} 
            disabled={isLoading || micDisabled} 
            aria-label={isListening ? "Stop voice typing" : "Start voice typing"}
          >
            {isListening ? <MicOff /> : <Mic />}
          </Button>
          <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()} aria-label="Send message">
            {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
