import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, MessageSquare, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function MyComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);

  useEffect(() => {
    fetchMyComplaints();

    // Real-time subscription for updates
    const channel = supabase
      .channel('my-complaints-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints'
        },
        () => {
          fetchMyComplaints();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaint_responses'
        },
        () => {
          fetchMyComplaints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMyComplaints = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Fetch my complaints
      const { data: complaintsData, error: complaintsError } = await supabase
        .from("complaints")
        .select("*")
        .eq("student_id", session.user.id)
        .order("created_at", { ascending: false });

      if (complaintsError) throw complaintsError;

      if (!complaintsData || complaintsData.length === 0) {
        setComplaints([]);
        setIsLoading(false);
        return;
      }

      const complaintIds = complaintsData.map(c => c.id);

      // Fetch responses separately
      const { data: responsesData } = await supabase
        .from("complaint_responses")
        .select("*")
        .in("complaint_id", complaintIds);

      // Fetch responder profiles
      const responderIds = [...new Set((responsesData || []).map(r => r.responder_id))];
      let respondersData: any[] = [];
      if (responderIds.length > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, user_type")
          .in("user_id", responderIds);
        respondersData = data || [];
      }

      // Merge data
      const respondersMap = respondersData.reduce((acc, responder) => {
        acc[responder.user_id] = responder;
        return acc;
      }, {} as Record<string, any>);

      const responsesMap = (responsesData || []).reduce((acc, response) => {
        if (!acc[response.complaint_id]) acc[response.complaint_id] = [];
        acc[response.complaint_id].push({
          ...response,
          profiles: respondersMap[response.responder_id]
        });
        return acc;
      }, {} as Record<string, any[]>);

      const combined = complaintsData.map(complaint => ({
        ...complaint,
        complaint_responses: responsesMap[complaint.id] || []
      }));

      setComplaints(combined);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      toast.error("Failed to fetch your complaints");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "in_review":
        return <AlertCircle className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4" />;
      case "closed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "in_review":
        return "default";
      case "resolved":
        return "default";
      case "closed":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/student-dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-primary">My Complaints</h1>
          </div>
          <Button onClick={() => navigate("/student-complaint")}>
            <MessageSquare className="h-4 w-4 mr-2" />
            New Complaint
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {complaints.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No complaints yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't filed any complaints yet.
              </p>
              <Button onClick={() => navigate("/student-complaint")}>
                File Your First Complaint
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {complaints.map((complaint) => (
              <Card key={complaint.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{complaint.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Filed on {new Date(complaint.created_at).toLocaleDateString()} at{" "}
                        {new Date(complaint.created_at).toLocaleTimeString()}
                      </p>
                      <div className="flex gap-2">
                        <Badge variant={getPriorityVariant(complaint.priority)}>
                          {complaint.priority} priority
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(complaint.status)}
                          <Badge variant={getStatusVariant(complaint.status)}>
                            {complaint.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        {complaint.complaint_responses?.length > 0 && (
                          <Badge variant="outline">
                            {complaint.complaint_responses.length} response(s)
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedComplaint(complaint)}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Complaint Details</DialogTitle>
                        </DialogHeader>
                        
                        {selectedComplaint && (
                          <div className="space-y-6">
                            <Card>
                              <CardHeader>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-semibold">{selectedComplaint.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(selectedComplaint.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge variant={getPriorityVariant(selectedComplaint.priority)}>
                                      {selectedComplaint.priority}
                                    </Badge>
                                    <Badge variant={getStatusVariant(selectedComplaint.status)}>
                                      {selectedComplaint.status.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm">{selectedComplaint.description}</p>
                              </CardContent>
                            </Card>

                            {selectedComplaint.complaint_responses && selectedComplaint.complaint_responses.length > 0 ? (
                              <div className="space-y-4">
                                <h4 className="font-semibold">Responses from Staff</h4>
                                {selectedComplaint.complaint_responses.map((response: any) => (
                                  <Card key={response.id} className="bg-primary/5 border-primary/20">
                                    <CardContent className="pt-4">
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm">
                                            {response.profiles?.first_name} {response.profiles?.last_name}
                                          </span>
                                          <Badge variant="outline" className="text-xs">
                                            {response.profiles?.user_type}
                                          </Badge>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(response.created_at).toLocaleString()}
                                        </span>
                                      </div>
                                      <p className="text-sm">{response.response_text}</p>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            ) : (
                              <Card className="bg-muted/30">
                                <CardContent className="py-8 text-center">
                                  <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                  <p className="text-sm text-muted-foreground">
                                    No responses yet. Staff will review your complaint soon.
                                  </p>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
