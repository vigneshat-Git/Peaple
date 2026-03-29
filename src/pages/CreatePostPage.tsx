import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Loader2, 
  AlertCircle, 
  Upload, 
  X, 
  Image as ImageIcon, 
  Video,
  ChevronDown,
  Users,
  Type,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiService, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [communityOpen, setCommunityOpen] = useState(false);
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

  // Validation: either title or uploaded media required
  const uploadedMediaCount = mediaFiles.filter(f => f.uploaded).length;
  const canSubmit = selectedCommunity && (title.trim() || uploadedMediaCount > 0);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await apiService.getCommunities(1, 100);
        const data = (response as any).data || (response as any) || [];
        setCommunities(data);
        const communityName = searchParams.get('community');
        if (communityName) {
          const c = data.find((c: any) => c.name === communityName);
          if (c) setSelectedCommunity(c);
        }
      } catch (err) { console.error('Failed to fetch communities:', err); }
    };
    fetchCommunities();
  }, [searchParams]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
    e.target.value = '';
  }, [toast]);

  const uploadFile = async (mediaFile: MediaFile, index: number): Promise<string | null> => {
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
      
      return fileUrl;
    } catch (err) {
      console.error('Upload failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setMediaFiles(prev => prev.map((f, i) => i === index ? { ...f, uploading: false, error: errorMessage } : f));
      return null;
    }
  };

  const removeFile = useCallback((index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Auth required", description: "Please log in", variant: "destructive" }); return; }
    if (!selectedCommunity) { setError("Please select a community"); return; }
    if (!title.trim() && uploadedMediaCount === 0) { setError("Please add a title or upload media"); return; }

    try {
      setLoading(true); setError(null);

      // Local array to collect uploaded media URLs
      const uploadedMedia: Array<{ url: string; type: 'image' | 'video'; fileName: string }> = [];

      // Upload all files and collect URLs in local variable
      for (let i = 0; i < mediaFiles.length; i++) {
        const fileUrl = await uploadFile(mediaFiles[i], i);
        
        if (fileUrl) {
          uploadedMedia.push({
            url: fileUrl,
            type: mediaFiles[i].type,
            fileName: mediaFiles[i].file.name,
          });
        } else {
          // Upload failed for this file
          setError(`Failed to upload: ${mediaFiles[i].file.name}`);
          setLoading(false);
          return;
        }
      }

      console.log('Upload complete. Uploaded media:', uploadedMedia);
      console.log('Media count:', uploadedMedia.length);

      const postData = {
        title: title.trim() || undefined,
        content: content.trim() || undefined,
        community_id: selectedCommunity.id,
        media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
      };

      console.log('Creating post with data:', postData);

      await apiService.createPost(postData);

      toast({ title: "Post created" });
      navigate(`/c/${selectedCommunity.name}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create post");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Create a Post</h1>
          <p className="text-sm text-muted-foreground">Share your thoughts with the community</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Community Selector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Community <span className="text-destructive">*</span>
          </Label>
          <Popover open={communityOpen} onOpenChange={setCommunityOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={communityOpen}
                className="w-full justify-between h-11 bg-card hover:bg-accent"
              >
                {selectedCommunity ? (
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground">c/</span>
                    <span className="font-medium">{selectedCommunity.name}</span>
                    <span className="text-muted-foreground text-xs">
                      ({selectedCommunity.member_count?.toLocaleString()} members)
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Search and select a community...</span>
                )}
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search communities..." className="h-11" />
                <CommandList>
                  <CommandEmpty>No communities found.</CommandEmpty>
                  <CommandGroup>
                    {communities.map((community) => (
                      <CommandItem
                        key={community.id}
                        value={community.name}
                        onSelect={() => {
                          setSelectedCommunity(community);
                          setCommunityOpen(false);
                        }}
                        className="flex items-center justify-between py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">c/</span>
                          <span className="font-medium">{community.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {community.member_count?.toLocaleString()} members
                          </span>
                          {selectedCommunity?.id === community.id && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            Title
            <span className="text-xs text-muted-foreground font-normal">(or add media below)</span>
          </Label>
          <Input 
            id="title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="What's on your mind?" 
            className="h-11 text-base"
          />
        </div>

        {/* Content Textarea */}
        <div className="space-y-2">
          <Label htmlFor="content" className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Description
            <span className="text-xs text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea 
            id="content" 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            placeholder="Add more details, context, or links..."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Media Upload Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            Media
            <span className="text-xs text-muted-foreground font-normal">(optional)</span>
          </Label>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,video/mp4"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Media Preview Grid */}
          {mediaFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {mediaFiles.map((file, index) => (
                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                  {file.type === 'image' ? (
                    <img src={file.preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={file.preview} className="w-full h-full object-cover" preload="metadata" />
                  )}
                  
                  {/* Overlay with status */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
                    {/* Status indicators */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {file.uploading && (
                        <div className="h-6 w-6 rounded-full bg-primary/90 flex items-center justify-center">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                        </div>
                      )}
                      {file.uploaded && (
                        <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute bottom-2 right-2 h-6 w-6 rounded-full bg-destructive/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  
                  {/* Error overlay */}
                  {file.error && (
                    <div className="absolute inset-0 bg-destructive/80 flex items-center justify-center">
                      <p className="text-xs text-white text-center px-2">{file.error}</p>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add more button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
              >
                <Upload className="h-6 w-6" />
                <span className="text-xs">Add more</span>
              </button>
            </div>
          )}
          
          {/* Upload button (when no media) */}
          {mediaFiles.length === 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
            >
              <div className="flex gap-3">
                <ImageIcon className="h-6 w-6" />
                <Video className="h-6 w-6" />
              </div>
              <span className="text-sm">Click to upload images or videos</span>
              <span className="text-xs text-muted-foreground">JPEG, PNG, WebP, MP4 up to 100MB</span>
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button 
            type="submit" 
            disabled={loading || !canSubmit} 
            className="flex-1 h-11"
            size="default"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Post
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="default"
            className="h-11 px-6"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostPage;
