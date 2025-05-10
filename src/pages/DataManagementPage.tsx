
import { format, subDays } from 'date-fns'; // Added for date manipulation and formatting
import { CalendarIcon } from 'lucide-react'; // Added for date picker icon
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'; // Assuming Popover components exist
import { Calendar } from '../components/ui/calendar'; // Assuming Calendar component exists
import { Checkbox } from '../components/ui/checkbox'; // Assuming Checkbox component exists
import { Label } from '../components/ui/label'; // Assuming Label component exists
import { cn } from '../lib/utils'; // Assuming utility function for class names
import React, { useState, useRef } from 'react'; // Added useRef
import { Button } from '../components/ui/button'; // Adjust path
import { toast } from 'sonner'; // Adjust path
import { useAuth } from '../contexts/AuthContext'; // Adjust path to AuthContext
// Updated import path for data management functions
import { exportUserRegistros, importMentorData } from '../features/registroConciencia/services/dataManagementService';
import { ImportResult } from '../types/registro'; // Added ImportResult
import { Loader2, Upload } from 'lucide-react'; // Added Upload icon

const DataManagementPage: React.FC<{
  triggerGlobalRefresh: () => void; // Prop to trigger data refresh after import
}> = ({ triggerGlobalRefresh }) => { // Added prop
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false); // Added import state
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [includeEmptyPeriods, setIncludeEmptyPeriods] = useState(false);

  const handleExport = async () => {
    if (!user || !user.id) {
      toast.error("Debes iniciar sesión para exportar datos.");
      return;
    }

    setIsExporting(true);
    toast.loading("Preparando exportación...", { id: 'export-toast' });

    try {
      // Prepare export options based on state
      const exportOptions = {
        startDate: startDate,
        endDate: endDate,
        includeEmptyPeriods: includeEmptyPeriods, // Now using the state for HU 5.5
      };

      const jsonData = await exportUserRegistros(user.id, exportOptions);

      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Generate descriptive file name
      const start = startDate ? format(startDate, 'yyyy-MM-dd') : 'inicio';
      const end = endDate ? format(endDate, 'yyyy-MM-dd') : 'fin';
      const filename = `sendero_interior_export_${start}_a_${end}.json`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Datos exportados exitosamente. La descarga debería comenzar pronto.", { id: 'export-toast' });

    } catch (error) {
      console.error("Error al exportar datos:", error);
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido al exportar.";
      toast.error(errorMessage, { id: 'export-toast' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickDateRange = (range: 'today' | 'yesterday' | 'last7days') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    if (range === 'today') {
      setStartDate(today);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999); // End of today
      setEndDate(endOfToday);
    } else if (range === 'yesterday') {
      const yesterday = subDays(today, 1);
      setStartDate(yesterday);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      setEndDate(endOfYesterday);
    } else if (range === 'last7days') {
      const sevenDaysAgo = subDays(today, 6); // Include today
      setStartDate(sevenDaysAgo);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      setEndDate(endOfToday);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return; // No file selected
    }

    const file = files[0];
    const reader = new FileReader();

    reader.onloadstart = () => {
      setIsImporting(true);
      toast.loading("Leyendo archivo......", { id: 'import-toast' });
    };

    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("Error al leer el archivo como texto.");
        }

        const jsonData = JSON.parse(text);

        toast.loading("Importando datos...", { id: 'import-toast' })
        const importResult: ImportResult = await importMentorData(jsonData);

        toast.success(`Importación completa: ${importResult.notasAgregadas} notas añadidas, ${importResult.registrosSugeridos} registros sugeridos.`, { id: 'import-toast' });

        // Trigger a global refresh to update UI with new data
        if (triggerGlobalRefresh) {
          triggerGlobalRefresh();
        }

      } catch (error) {
        console.error("Error al importar datos:", error);
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido al importar.";
        toast.error(`Error de importación: ${errorMessage}`, { id: 'import-toast' });
      } finally {
        setIsImporting(false);
        // Reset file input so the same file can be selected again if needed
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      toast.error("Error al leer el archivo.", { id: 'import-toast' });
      setIsImporting(false);
       if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
    };

    reader.readAsText(file);
  };

  const handleImportButtonClick = () => {
    fileInputRef.current?.click(); // Trigger the hidden file input
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Gestión de Datos</h1>
        <p className="text-red-500">Debes iniciar sesión para acceder a esta página.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Datos</h1>
      <p className="text-muted-foreground mb-6">
        Gestiona tus datos de registros de conciencia.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Section */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Exportar Datos</h2>
          <p className="text-muted-foreground mb-4">
            Descarga todos tus registros y notas en formato JSON.
          </p>
          {/* Date Range Selection */}
          <div className="mt-6 p-4 border rounded-md bg-card">
            <p className="text-sm font-semibold mb-3">Filtrar por rango de fechas (Opcional):</p>
            <div className="flex flex-wrap gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('today')}>Hoy</Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('yesterday')}>Ayer</Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('last7days')}>Últimos 7 Días</Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Start Date Picker */}
              <div className="flex-1">
                <Label htmlFor="startDate">Fecha de Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                      id="startDate"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span className="text-muted-foreground">Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {/* End Date Picker */}
              <div className="flex-1">
                <Label htmlFor="endDate">Fecha de Fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                      id="endDate"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span className="text-muted-foreground">Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {/* Include Empty Periods Checkbox (User Story 5.5 UI) */}
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="includeEmptyPeriods"
                checked={includeEmptyPeriods}
                onCheckedChange={(checked) => setIncludeEmptyPeriods(!!checked)}
              />
              <Label htmlFor="includeEmptyPeriods">
                Incluir anotaciones de periodos vacíos
              </Label>
            </div>
          </div>

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={isExporting || isImporting} // Disable during import too
            className="min-w-[150px] mt-6"
          >
            {isExporting ? (
              <span className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exportando...</span>
            ) : (
              "Generar y Descargar JSON"
            )}
          </Button>
        </div>

        {/* Import Section */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Importar Datos del Mentor</h2>
          <p className="text-muted-foreground mb-4">
            Sube un archivo JSON proporcionado por tu mentor para añadir notas o sugerencias de registros.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".json" // Accept only JSON files
          />
          <Button
            onClick={handleImportButtonClick}
            disabled={isImporting || isExporting} // Disable during export too
            className="min-w-[150px]"
          >
            {isImporting ? (
              <span className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importando...</span>
            ) : (
              <span className="flex items-center"><Upload className="mr-2 h-4 w-4" /> Importar JSON</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataManagementPage;