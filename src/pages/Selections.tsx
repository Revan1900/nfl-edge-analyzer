import { useUserSelections, useDeleteSelection } from '@/hooks/useUserData';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Selections = () => {
  const navigate = useNavigate();
  const { data: selections, isLoading } = useUserSelections();
  const deleteSelection = useDeleteSelection();

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this selection?')) {
      deleteSelection.mutate(id);
    }
  };

  const handleExportCSV = () => {
    if (!selections || selections.length === 0) return;

    const headers = ['Game ID', 'Market Type', 'Selected Side', 'Note', 'Saved At', 'Result'];
    const rows = selections.map(s => [
      s.game_id,
      s.market_type,
      s.selected_side,
      s.note || '',
      new Date(s.saved_at).toLocaleString(),
      s.result || 'Pending',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selections-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Selections</h1>
            <p className="text-muted-foreground">
              {selections?.length || 0} saved picks
            </p>
          </div>
          {selections && selections.length > 0 && (
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>

        {selections && selections.length > 0 ? (
          <div className="space-y-4">
            {selections.map((selection) => (
              <Card key={selection.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{selection.game_id}</h3>
                        <Badge variant="secondary">{selection.market_type}</Badge>
                        {selection.result && (
                          <Badge variant={selection.result === 'win' ? 'default' : 'destructive'}>
                            {selection.result}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">
                        Selected: <span className="font-medium">{selection.selected_side}</span>
                      </p>
                      {selection.note && (
                        <p className="text-sm text-muted-foreground">
                          Note: {selection.note}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Saved {new Date(selection.saved_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/game/${selection.game_id}`)}
                      >
                        View Game
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(selection.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No selections yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Start saving your picks from game detail pages to track your selections here.
              </p>
              <Button onClick={() => navigate('/')}>
                Browse Games
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Selections;