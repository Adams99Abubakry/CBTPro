import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Video, File } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CourseMaterialsUpload() {
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileType, setFileType] = useState<"note" | "video" | "document">("note");
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!title.trim()) {
        toast({
          title: "Error",
          description: "Please enter a title for the material",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${userData.user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from("course-materials")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("course-materials")
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from("course_materials")
        .insert({
          title,
          description,
          file_url: urlData.publicUrl,
          file_type: fileType,
          file_name: file.name,
          lecturer_id: userData.user.id,
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Material uploaded successfully",
      });

      setTitle("");
      setDescription("");
      event.target.value = "";
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getIcon = () => {
    switch (fileType) {
      case "note":
        return <FileText className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Course Materials
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Enter material title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Brief description of the material"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fileType">Material Type</Label>
          <Select value={fileType} onValueChange={(value: any) => setFileType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="note">Note/Document</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="document">Other Document</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="file">Upload File</Label>
          <div className="flex items-center gap-2">
            <Input
              id="file"
              type="file"
              onChange={handleUpload}
              disabled={uploading}
              accept={fileType === "video" ? "video/*" : ".pdf,.doc,.docx,.txt,.ppt,.pptx"}
            />
            {getIcon()}
          </div>
        </div>

        {uploading && (
          <p className="text-sm text-muted-foreground">Uploading...</p>
        )}
      </CardContent>
    </Card>
  );
}
