import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MessageSquare, Reply, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ComplaintManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [responseText, setResponseText] = useState("");
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Real-time subscription for complaints and responses
    const channel = supabase
      .channel('complaint-management-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints'
        },
        () => {
          fetchComplaints();
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
          fetchComplaints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (!profile || !["admin", "lecturer"].includes(profile.user_type)) {
      toast.error("Access denied. Admin or Lecturer privileges required.");
      navigate("/");
      return;
    }

    setUser({ ...session.user, profile });
    fetchComplaints();
    setIsLoading(false);
  };

  const fetchComplaints = async () => {
    try {
      // Fetch complaints first
      const { data: complaintsData, error: complaintsError } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });

      if (complaintsError) throw complaintsError;

      if (!complaintsData || complaintsData.length === 0) {
        setComplaints([]);
        return;
      }

      // Get student IDs and complaint IDs for separate fetches
      const studentIds = [...new Set(complaintsData.map(c => c.student_id))];
      const complaintIds = complaintsData.map(c => c.id);

      // Fetch student profiles separately
      const { data: studentsData } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", studentIds);

      // Fetch complaint responses separately  
      const { data: responsesData } = await supabase
        .from("complaint_responses")
        .select("*")
        .in("complaint_id", complaintIds);

      // Get responder IDs for separate fetch
      const responderIds = [...new Set((responsesData || []).map(r => r.responder_id))];
      let respondersData: any[] = [];
      if (responderIds.length > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, user_type")
          .in("user_id", responderIds);
        respondersData = data || [];
      }

      // Merge data client-side
      const studentsMap = (studentsData || []).reduce((acc, student) => {
        acc[student.user_id] = student;
        return acc;
      }, {} as Record<string, any>);

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
        profiles: studentsMap[complaint.student_id],
        complaint_responses: responsesMap[complaint.id] || []
      }));

      setComplaints(combined);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      toast.error("Failed to fetch complaints");
    }
  };

  const handleResponse = async (complaintId: string) => {
    if (!responseText.trim()) {
      toast.error("Please enter a response");
      return;
    }

    try {
      const { error } = await supabase
        .from("complaint_responses")
        .insert({
          complaint_id: complaintId,
          responder_id: user.id,
          response_text: responseText,
          is_admin_response: user.profile.user_type === "admin"
        });

      if (error) {
        console.error("Response insert error:", error);
        toast.error(`Failed to submit response: ${error.message}`);
        return;
      }

      // Update complaint status if provided
      if (newStatus) {
        const { error: statusError } = await supabase
          .from("complaints")
          .update({ status: newStatus })
          .eq("id", complaintId);
        
        if (statusError) {
          console.error("Status update error:", statusError);
        }
      }

      toast.success("Response submitted successfully");
      setResponseText("");
      setNewStatus("");
      setSelectedComplaint(null);
      await fetchComplaints();
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred");
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
        return "secondary";
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(user.profile.user_type === "admin" ? "/admin-dashboard" : "/lecturer-dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-primary">Complaint Management</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">All Complaints</h2>
          </CardHeader>
          <CardContent>
            {complaints.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No complaints found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Responses</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell>
                        {complaint.profiles?.first_name} {complaint.profiles?.last_name}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {complaint.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityVariant(complaint.priority)}>
                          {complaint.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(complaint.status)}
                          <Badge variant={getStatusVariant(complaint.status)}>
                            {complaint.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {complaint.complaint_responses?.length || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedComplaint(complaint)}
                            >
                              <Reply className="h-4 w-4 mr-2" />
                              View & Respond
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
                                        <p className="text-sm text-muted-foreground">
                                          By: {selectedComplaint.profiles?.first_name} {selectedComplaint.profiles?.last_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
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

                                {selectedComplaint.complaint_responses && selectedComplaint.complaint_responses.length > 0 && (
                                  <div className="space-y-4">
                                    <h4 className="font-semibold">Responses</h4>
                                    {selectedComplaint.complaint_responses.map((response: any) => (
                                      <Card key={response.id} className="bg-muted/30">
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
                                )}

                                <div className="space-y-4">
                                  <h4 className="font-semibold">Add Response</h4>
                                  <div>
                                    <Label htmlFor="response">Response</Label>
                                    <Textarea
                                      id="response"
                                      value={responseText}
                                      onChange={(e) => setResponseText(e.target.value)}
                                      placeholder="Enter your response..."
                                      rows={4}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="status">Update Status (Optional)</Label>
                                    <Select value={newStatus} onValueChange={setNewStatus}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Keep current status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="in_review">In Review</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button 
                                    onClick={() => handleResponse(selectedComplaint.id)}
                                    className="w-full"
                                  >
                                    Submit Response
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}