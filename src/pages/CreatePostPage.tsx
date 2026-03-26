import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle, Upload, X, Image, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiService, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Community { id: string; name: string; description: string; member_count: number; }
interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
}

const CreatePostPage = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await apiService.getCommunities(1, 100);
        const data = (response as any).data || (response as any) || [];
        setCommunities(data);
        const communityName = searchParams.get('community');
        if (communityName) {
          const c = data.find((c: any) => c.name === communityName);
          if (c) setSelectedCommunity(c.id);
        }
      } catch (err) { console.error('Failed to fetch communities:', err); }
    };
    fetchCommunities();
  }, [searchParams]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: MediaFile[] = [];

    for (const file of files) {
      if (file.size > 100 * 1024 * 1024) { // 100MB
        toast({ title: "File too large", description: `${file.name} exceeds 100MB limit`, variant: "destructive" });
        continue;
      }

      const type = file.type.startsWith('image/') ? 'image' : file.type === 'video/mp4' ? 'video' : null;
      if (!type) {
        toast({ title: "Invalid file type", description: `${file.name} is not supported`, variant: "destructive" });
        continue;
      }

      const preview = URL.createObjectURL(file);
      validFiles.push({
        file,
        preview,
        type,
        uploading: false,
        uploaded: false,
      });
    }

    setMediaFiles(prev => [...prev, ...validFiles]);
    e.target.value = ''; // Reset input
  };

  const uploadFile = async (mediaFile: MediaFile, index: number) => {
    try {
      setMediaFiles(prev => prev.map((f, i) => i === index ? { ...f, uploading: true, error: undefined } : f));

      console.log('Requesting upload URL for file:', mediaFile.file.name, 'type:', mediaFile.file.type);
      
      const { uploadUrl, fileUrl } = await apiService.generateUploadUrl({
        fileType: mediaFile.file.type,
        fileName: mediaFile.file.name,
      });

      console.log('Upload URL received:', uploadUrl);
      console.log('File URL (public):', fileUrl);
      
      // Validate uploadUrl before using
      if (!uploadUrl || uploadUrl === 'undefined') {
        throw new Error('Upload URL is missing or invalid');
      }

      console.log('Uploading file to:', uploadUrl);
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: mediaFile.file,
        headers: {
          'Content-Type': mediaFile.file.type,
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }
      
      console.log('File uploaded successfully to R2');

      setMediaFiles(prev => prev.map((f, i) => i === index ? { ...f, uploading: false, uploaded: true, url: fileUrl } : f));
    } catch (err) {
      console.error('Upload failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setMediaFiles(prev => prev.map((f, i) => i === index ? { ...f, uploading: false, error: errorMessage } : f));
    }
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Auth required", description: "Please log in", variant: "destructive" }); return; }
    if (!selectedCommunity || !title.trim()) { setError("Fill in all fields"); return; }

    try {
      setLoading(true); setError(null);

      // Upload all files
      const uploadPromises = mediaFiles.map((file, index) => uploadFile(file, index));
      await Promise.all(uploadPromises);

      // Check if all uploads succeeded
      const failedUploads = mediaFiles.filter(f => f.error);
      if (failedUploads.length > 0) {
        setError("Some files failed to upload");
        return;
      }

      const uploadedMedia = mediaFiles
        .filter(f => f.uploaded && f.url)
        .map(f => ({ url: f.url!, type: f.type, fileName: f.file.name }));

      console.log('Upload complete. Uploaded media:', uploadedMedia);
      console.log('Media count:', uploadedMedia.length);

      if (mediaFiles.length > 0 && uploadedMedia.length === 0) {
        setError("Media upload failed. Please try again.");
        return;
      }

      const postData = {
        title: title.trim(),
        content: content.trim(),
        community_id: selectedCommunity,
        media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
      };

      console.log('Creating post with data:', postData);

      await apiService.createPost(postData);

      console.log('Post created successfully');

      const community = communities.find(c => c.id === selectedCommunity);
      toast({ title: "Post created" });
      navigate(`/c/${community?.name}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create post");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-lg font-bold text-foreground mb-4">Create a Post</h1>
      <form onSubmit={handleSubmit} className="bg-card rounded-md border p-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="community" className="text-sm">Community</Label>
          <select id="community" value={selectedCommunity} onChange={(e) => setSelectedCommunity(e.target.value)}
            className="w-full h-9 px-3 rounded-md border bg-background text-sm text-foreground focus:outline-none focus:border-primary transition-colors duration-150" required>
            <option value="">Select a community</option>
            {communities.map(c => <option key={c.id} value={c.id}>c/{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-sm">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="An interesting title..." required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="content" className="text-sm">Content</Label>
          <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share your thoughts..." rows={6} />
        </div>

        {/* Media Upload Section */}
        <div className="space-y-1.5">
          <Label className="text-sm">Media (optional)</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,video/mp4"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Add Images/Videos
          </Button>
          <p className="text-xs text-muted-foreground">Supported: JPEG, PNG images and MP4 videos (max 100MB)</p>
        </div>

        {/* Media Preview Grid */}
        {mediaFiles.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {mediaFiles.map((file, index) => (
              <div key={index} className="relative group">
                {file.type === 'image' ? (
                  <img src={file.preview} alt="Preview" className="w-full h-24 object-cover rounded border" />
                ) : (
                  <video src={file.preview} className="w-full h-24 object-cover rounded border" preload="metadata" />
                )}
                <div className="absolute top-1 right-1 flex gap-1">
                  {file.uploading && <Loader2 className="h-4 w-4 animate-spin bg-black/50 text-white rounded p-0.5" />}
                  {file.uploaded && <div className="h-4 w-4 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</div>}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                {file.error && <p className="text-xs text-destructive mt-1">{file.error}</p>}
              </div>
            ))}
          </div>
        )}

        {error && <div className="flex items-center gap-2 text-destructive text-xs"><AlertCircle className="h-3.5 w-3.5" />{error}</div>}
        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1" size="sm">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : "Post"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostPage;
