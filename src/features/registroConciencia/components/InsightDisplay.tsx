import React from 'react';
import { Insight } from '../../../types/registro';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Lightbulb } from 'lucide-react';

interface InsightDisplayProps {
  insights: Insight[];
}

export const InsightDisplay: React.FC<InsightDisplayProps> = ({ insights }) => {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-3 flex items-center">
        <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
        Sugerencias del Sistema
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map(insight => (
          <Card key={insight.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{insight.type === 'pattern' ? 'Patrón Identificado' : 'Elemento Pendiente'}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{insight.message}</p>

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};