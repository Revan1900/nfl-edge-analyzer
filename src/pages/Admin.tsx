import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, Database, Users, ExternalLink } from 'lucide-react';
import { AdminForceRefreshButton } from '@/components/AdminForceRefreshButton';

interface Source {
  id: string;
  source_name: string;
  source_url: string;
  source_type: string;
  is_active: boolean;
  robots_compliant: boolean;
  consecutive_failures: number;
  last_success: string | null;
  last_failure: string | null;
}

interface UserShare {
  id: string;
  url: string;
  source_domain: string;
  status: string;
  tags: string[];
  user_id: string;
  created_at: string;
  rejection_reason: string | null;
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<Source[]>([]);
  const [shares, setShares] = useState<UserShare[]>([]);
  const [newSource, setNewSource] = useState({ name: '', url: '', type: 'api' });

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });

      if (error) throw error;

      if (!data) {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You do not have admin privileges.',
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      await Promise.all([loadSources(), loadShares()]);
    } catch (error) {
      console.error('Admin check error:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadSources = async () => {
    const { data, error } = await supabase
      .from('source_registry')
      .select('*')
      .order('source_name');

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error loading sources',
        description: error.message,
      });
      return;
    }

    setSources(data || []);
  };

  const loadShares = async () => {
    const { data, error } = await supabase
      .from('user_shares')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error loading shares',
        description: error.message,
      });
      return;
    }

    setShares(data || []);
  };

  const toggleSourceActive = async (sourceId: string, currentState: boolean) => {
    const { error } = await supabase
      .from('source_registry')
      .update({ is_active: !currentState })
      .eq('id', sourceId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error updating source',
        description: error.message,
      });
      return;
    }

    await loadSources();
    toast({ title: 'Source updated successfully' });
  };

  const addSource = async () => {
    if (!newSource.name || !newSource.url) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please provide source name and URL.',
      });
      return;
    }

    const { error } = await supabase.from('source_registry').insert({
      source_name: newSource.name,
      source_url: newSource.url,
      source_type: newSource.type,
      is_active: true,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error adding source',
        description: error.message,
      });
      return;
    }

    setNewSource({ name: '', url: '', type: 'api' });
    await loadSources();
    toast({ title: 'Source added successfully' });
  };

  const moderateShare = async (shareId: string, approve: boolean, reason?: string) => {
    const updateData: any = {
      status: approve ? 'approved' : 'rejected',
      moderated_by: user?.id,
      moderated_at: new Date().toISOString(),
    };

    if (!approve && reason) {
      updateData.rejection_reason = reason;
    }

    const { error } = await supabase
      .from('user_shares')
      .update(updateData)
      .eq('id', shareId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error moderating share',
        description: error.message,
      });
      return;
    }

    if (approve) {
      const share = shares.find((s) => s.id === shareId);
      if (share) {
        await supabase.from('source_registry').insert({
          source_name: share.source_domain,
          source_url: share.url,
          source_type: 'user_submitted',
          is_active: true,
        });
      }
    }

    await loadShares();
    toast({ title: `Share ${approve ? 'approved' : 'rejected'} successfully` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>
        <AdminForceRefreshButton />
      </div>

      <Tabs defaultValue="sources" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sources">
            <Database className="w-4 h-4 mr-2" />
            Data Sources
          </TabsTrigger>
          <TabsTrigger value="moderation">
            <Users className="w-4 h-4 mr-2" />
            Moderation ({shares.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Add New Source</CardTitle>
              <CardDescription>Add a new data source to the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="source-name">Source Name</Label>
                  <Input
                    id="source-name"
                    value={newSource.name}
                    onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                    placeholder="ESPN Injuries"
                  />
                </div>
                <div>
                  <Label htmlFor="source-url">Source URL</Label>
                  <Input
                    id="source-url"
                    value={newSource.url}
                    onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addSource} className="w-full">
                    Add Source
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Existing Sources</CardTitle>
              <CardDescription>Manage data sources and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{source.source_name}</h3>
                        <Badge variant={source.is_active ? 'default' : 'secondary'}>
                          {source.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {source.consecutive_failures > 0 && (
                          <Badge variant="destructive">
                            {source.consecutive_failures} failures
                          </Badge>
                        )}
                      </div>
                      <a
                        href={source.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:underline flex items-center gap-1 mt-1"
                      >
                        {source.source_url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <Switch
                      checked={source.is_active}
                      onCheckedChange={() => toggleSourceActive(source.id, source.is_active)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation">
          <Card>
            <CardHeader>
              <CardTitle>Pending Submissions</CardTitle>
              <CardDescription>Review and moderate user-submitted sources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shares.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No pending submissions
                  </p>
                ) : (
                  shares.map((share) => (
                    <div key={share.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <a
                            href={share.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold hover:underline flex items-center gap-1"
                          >
                            {share.source_domain}
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <p className="text-sm text-muted-foreground mt-1">{share.url}</p>
                          <div className="flex gap-2 mt-2">
                            {share.tags.map((tag) => (
                              <Badge key={tag} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Submitted {new Date(share.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => moderateShare(share.id, true)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const reason = prompt('Rejection reason (optional):');
                            moderateShare(share.id, false, reason || undefined);
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
