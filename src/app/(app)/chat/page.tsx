
'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Send, User, Sparkles, Loader2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatWithAICoach } from '@/ai/flows/chat-with-ai-coach';
import type { ChatMessage, FlowChatMessage } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile } from '@/lib/localStorage'; // To get user's name for avatar

export default function ChatPage() {
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [userName, setUserName] = useState<string>('User');
  const [userImage, setUserImage] = useState<string | null>(null);

  useEffect(() => {
    const profile = getUserProfile();
    if (profile) {
      setUserName(profile.name || 'User');
      setUserImage(profile.profileImageUri || null);
    }
    // Add an initial greeting message from the AI
    setChatHistory([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: "Hi there! I'm EcoAICoach. How can I help you with your nutrition, fitness, or using the app today?",
        timestamp: new Date().toISOString(),
      }
    ]);
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

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
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: msg.text,
      }));
    
    // Add the current user message to flow history for the AI
    flowHistory.push({ role: 'user', content: userMessage.text });


    try {
      const result = await chatWithAICoach({
        userInput: userMessage.text,
        chatHistory: flowHistory.slice(-10), // Send last 10 messages for context to save tokens
      });

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: result.aiResponse,
        timestamp: new Date().toISOString(),
      };
      setChatHistory((prevHistory) => [...prevHistory, aiMessage]);
    } catch (error) {
      console.error('Error calling chat AI flow:', error);
      toast({
        variant: 'destructive',
        title: 'Chat Error',
        description: 'Could not get a response from the AI coach. Please try again.',
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

  return (
    <Card className="w-full h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] flex flex-col shadow-xl border-primary/20">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-primary">
          <MessageCircle className="h-6 w-6" />
          Chat with EcoAI Coach
        </CardTitle>
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
          <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()} aria-label="Send message">
            {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
