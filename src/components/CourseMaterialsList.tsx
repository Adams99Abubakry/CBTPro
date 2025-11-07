import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Video, File, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CourseMaterial {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_name: string;
  lecturer_id: string;
  created_at: string;
}

interface CourseMaterialsListProps {
  canDelete?: boolean;
}

export function CourseMaterialsList({ canDelete = false }: CourseMaterialsListProps) {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    const init = async () => {
      if (canDelete) {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id ?? null);
        await fetchMaterials(user?.id ?? undefined);
      } else {
        await fetchMaterials();
      }
    };
    init();
  }, [canDelete]);

  const fetchMaterials = async (lecturerId?: string) => {
    try {
      let query = supabase
        .from("course_materials")
        .select("*")
        .order("created_at", { ascending: false });

      if (canDelete && lecturerId) {
        query = query.eq("lecturer_id", lecturerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMaterials(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      // Extract the file path from the URL
      const urlParts = fileUrl.split('/course-materials/');
      const filePath = urlParts.length > 1 ? urlParts[1] : fileUrl.split("/").pop();
      
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from("course-materials")
          .remove([filePath]);

        if (storageError) {
          console.error("Storage deletion error:", storageError);
          // Continue with database deletion even if storage fails
        }
      }

      const { data: deletedRows, error } = await supabase
        .from("course_materials")
        .delete()
        .eq("id", id)
        .select("id");

      if (error) throw error;
      if (!deletedRows || deletedRows.length === 0) {
        throw new Error("Unable to delete this material. You can only delete materials you uploaded.");
      }

      toast({
        title: "Success",
        description: "Material deleted successfully",
      });

      fetchMaterials(userId ?? undefined);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "note":
        return <FileText className="h-5 w-5 text-primary" />;
      case "video":
        return <Video className="h-5 w-5 text-primary" />;
      default:
        return <File className="h-5 w-5 text-primary" />;
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading materials...</p>;
  }

  if (materials.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No course materials available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {materials.map((material) => (
        <Card key={material.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getIcon(material.file_type)}
                <span>{material.title}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
                {canDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(material.id, material.file_url)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {material.description && (
              <p className="text-sm text-muted-foreground mb-2">{material.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Uploaded: {new Date(material.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
