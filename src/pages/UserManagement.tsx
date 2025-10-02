import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Users, UserCheck, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchUsers();

    // Real-time subscription for user changes
    const channel = supabase
      .channel('user-management-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = users.filter(user =>
      `${(user.first_name || '')} ${(user.last_name || '')}`.toLowerCase().includes(term) ||
      (user.email || '').toLowerCase().includes(term) ||
      (user.user_type || '').toLowerCase().includes(term) ||
      (user.status || '').toLowerCase().includes(term)
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("user_id", session.user.id)
      .single();

    if (profile?.user_type !== "admin") {
      toast.error("Access denied. Admin privileges required.");
      navigate("/admin-dashboard");
      return;
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("user_id", userId);

      if (error) throw error;
      
      toast.success(`User ${newStatus} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error(`Failed to update user status`);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      active: "default",
      pending: "secondary",
      rejected: "destructive",
      suspended: "outline"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getRoleBadge = (userType: string) => {
    const variants: any = {
      admin: "destructive",
      lecturer: "default",
      student: "secondary"
    };
    return <Badge variant={variants[userType] || "default"}>{userType}</Badge>;
  };

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.user_type === 'admin').length;
  const lecturerCount = users.filter(u => u.user_type === 'lecturer').length;
  const studentCount = users.filter(u => u.user_type === 'student').length;
  const activeCount = users.filter(u => u.status === 'active').length;
  const pendingCount = users.filter(u => u.status === 'pending').length;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin-dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-primary">User Management</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                <div>
                  <h2 className="text-xl font-semibold">All Users ({totalUsers})</h2>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>Admins: {adminCount}</span>
                    <span>Lecturers: {lecturerCount}</span>
                    <span>Students: {studentCount}</span>
                    <span>Active: {activeCount}</span>
                    <span>Pending: {pendingCount}</span>
                  </div>
                </div>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      {`${user.first_name || 'N/A'} ${user.last_name || ''}`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email || 'N/A'}</TableCell>
                    <TableCell>{getRoleBadge(user.user_type)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="space-x-2">
                      {user.status === "active" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateUserStatus(user.user_id, "suspended")}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
                      ) : user.status === "suspended" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateUserStatus(user.user_id, "active")}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Activate
                        </Button>
                      ) : user.status === "pending" ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateUserStatus(user.user_id, "active")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateUserStatus(user.user_id, "rejected")}
                          >
                            Reject
                          </Button>
                        </>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}