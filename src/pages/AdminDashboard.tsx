import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, GraduationCap, FileText, Settings, LogOut, MessageSquare, BarChart3, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [pendingLecturers, setPendingLecturers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeLecturers: 0,
    totalExams: 0,
    pendingComplaints: 0
  });

  useEffect(() => {
    checkAuth();
    fetchDashboardData();
  }, []);

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

    if (profile?.user_type !== "admin") {
      toast.error("Access denied. Admin privileges required.");
      navigate("/");
      return;
    }

    setUser(session.user);
    setProfile(profile);
    setIsLoading(false);
  };

  const fetchDashboardData = async () => {
    // Fetch pending lecturers
    const { data: pendingData } = await supabase
      .from("profiles")
      .select(`
        *,
        lecturer_qualifications (*)
      `)
      .eq("user_type", "lecturer")
      .eq("status", "pending");

    setPendingLecturers(pendingData || []);

    // Fetch statistics
    const { data: allUsers } = await supabase
      .from("profiles")
      .select("id");

    const { data: activeLecturers } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_type", "lecturer")
      .eq("status", "active");

    const { data: totalExams } = await supabase
      .from("exams")
      .select("id");

    const { data: pendingComplaints } = await supabase
      .from("complaints")
      .select("id")
      .eq("status", "pending");

    setStats({
      totalUsers: allUsers?.length || 0,
      activeLecturers: activeLecturers?.length || 0,
      totalExams: totalExams?.length || 0,
      pendingComplaints: pendingComplaints?.length || 0
    });
  };

  const handleApprove = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ status: "active" })
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to approve lecturer");
    } else {
      toast.success("Lecturer approved successfully");
      fetchDashboardData();
    }
  };

  const handleReject = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ status: "rejected" })
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to reject lecturer");
    } else {
      toast.success("Lecturer application rejected");
      fetchDashboardData();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.first_name} {profile?.last_name}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Lecturers</p>
                  <p className="text-2xl font-bold">{stats.activeLecturers}</p>
                </div>
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Exams</p>
                  <p className="text-2xl font-bold">{stats.totalExams}</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Complaints</p>
                  <p className="text-2xl font-bold">{stats.pendingComplaints}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <h2 className="text-xl font-semibold">Pending Lecturer Approvals</h2>
            </CardHeader>
            <CardContent>
              {pendingLecturers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No pending approvals</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Qualification</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingLecturers.map((lecturer) => (
                      <TableRow key={lecturer.user_id}>
                        <TableCell>{`${lecturer.first_name || ''} ${lecturer.last_name || ''}`}</TableCell>
                        <TableCell>{lecturer.lecturer_qualifications?.[0]?.degree || 'N/A'}</TableCell>
                        <TableCell>{lecturer.lecturer_qualifications?.[0]?.experience_years || 'N/A'} years</TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(lecturer.user_id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(lecturer.user_id)}
                          >
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Admin Actions</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate("/complaint-management")}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Manage Complaints
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate("/user-management")}
              >
                <Users className="h-4 w-4 mr-2" />
                User Management
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate("/system-analytics")}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                System Analytics
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate("/security-settings")}
              >
                <Shield className="h-4 w-4 mr-2" />
                Security Settings
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate("/system-settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}