// src/layouts/AppLayout.tsx
// "use client"; // Removed

import React, { useState, ReactNode, useEffect } from 'react';
import { Home, BookOpen, Target, Plus, User, Calendar as CalendarIconLucide } from 'lucide-react';

import { RegistroList } from '../features/registroConciencia/components/RegistroList';
import { IntentionList } from '../features/registroConciencia/components/IntentionList';
import DailyTimelineView from '../features/registroConciencia/components/DailyTimelineView';
import { RegistroFormDialog } from '../features/registroConciencia/components/RegistroFormDialog';
import { Button } from '../components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface AppLayoutProps {
  children?: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [activeTab, setActiveTab] = useState<string>('history');
  const [refresherKey, setRefresherKey] = useState<number>(0);
  // State for the selected date for DailyTimelineView (User Story 5.2)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    console.log("AppLayout mounted. Initial activeTab:", activeTab);
  }, []); 

  const triggerRefresh = () => {
    console.log("triggerRefresh called in AppLayout");
    setRefresherKey(prevKey => prevKey + 1);
    // If the active tab is one that needs refreshing, force a reload
    // This might be handled by the components themselves listening to refresherKey
  };

  const tabs: Tab[] = [
    { id: 'history', label: 'Historial', icon: BookOpen },
    { id: 'intentions', label: 'Intenciones', icon: Target },
    { id: 'daily', label: 'Diario', icon: CalendarIconLucide },
    // { id: 'profile', label: 'Perfil', icon: User },
  ];
  console.log("AppLayout: Tabs defined:", tabs);

  const handleTabClick = (tabId: string) => {
    console.log("AppLayout: Tab clicked, changing activeTab to:", tabId);
    setActiveTab(tabId);
    // When switching tabs, if the new tab is 'daily', ensure selectedDate is today
    if (tabId === 'daily') {
        setSelectedDate(new Date());
    }
  };

  const renderContent = () => {
    console.log("AppLayout: renderContent called. Current activeTab:", activeTab);
    switch (activeTab) {
      case 'history':
        console.log("AppLayout: Rendering RegistroList");
        return <RegistroList refresher={refresherKey} triggerGlobalRefresh={triggerRefresh} />;
      case 'intentions':
        console.log("AppLayout: Rendering IntentionList");
        return <IntentionList 
          refresher={refresherKey} 
          onIntentionUpdated={triggerRefresh} 
          triggerGlobalRefresh={triggerRefresh} 
        />;
      case 'daily':
        console.log("AppLayout: Rendering DailyTimelineView");
        return (
            <div className="flex flex-col items-center">
                {/* Date Picker for Daily View */}
                <div className="mb-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] justify-start text-left font-normal",
                                    !selectedDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIconLucide className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP") : <span>Selecciona una fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                    if (date) setSelectedDate(date);
                                }}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                {/* Render the Daily Timeline View */}
                <DailyTimelineView date={selectedDate} onAnnotationSaved={triggerRefresh} />
            </div>
        );
      // case 'profile':
      //   return <div className="text-center my-12 text-gray-500">Contenido para Perfil</div>;
      default:
        console.log("AppLayout: Rendering default content for unknown tab");
        return <div className="text-center my-12 text-gray-500">Selecciona una pestaña</div>;
    }
  };

  console.log("AppLayout: Rendering component. Current activeTab:", activeTab);

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-grow overflow-y-auto p-4 md:p-6">
        {children}
        {renderContent()}
      </main>

      <div className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-50">
        <RegistroFormDialog onRegistroGuardado={triggerRefresh}>
          <Button
            variant="default"
            size="lg"
            className="rounded-full shadow-lg w-14 h-14 flex items-center justify-center"
            aria-label="Añadir nuevo momento de conciencia"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </RegistroFormDialog>
      </div>

      <nav className="bg-background border-t border-border shadow-md">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          {tabs.map((tab) => {
            console.log("AppLayout: Mapping tab for navigation:", tab.label); 
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center justify-center p-2 w-full text-sm transition-colors
                  ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <tab.icon className={`h-6 w-6 mb-1 ${activeTab === tab.id ? 'text-primary' : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}