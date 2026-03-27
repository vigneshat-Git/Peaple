const PostSkeleton = () => {
  return (
    <div className="bg-card rounded-md border p-4 space-y-3 animate-pulse">
      {/* Header: Community, Author, Time */}
      <div className="flex items-center gap-2">
        <div className="h-3 bg-muted rounded w-16"></div>
        <div className="h-3 bg-muted rounded w-1"></div>
        <div className="h-3 bg-muted rounded w-24"></div>
        <div className="h-3 bg-muted rounded w-1"></div>
        <div className="h-3 bg-muted rounded w-12"></div>
      </div>

      {/* Title */}
      <div className="h-5 bg-muted rounded w-3/4"></div>

      {/* Content lines */}
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded w-full"></div>
        <div className="h-3 bg-muted rounded w-5/6"></div>
      </div>

      {/* Media placeholder */}
      <div className="w-full h-48 bg-muted rounded-md max-w-md"></div>

      {/* Footer: Vote, Comments, Share, Save */}
      <div className="flex items-center gap-3 pt-2">
        <div className="h-8 bg-muted rounded w-10"></div>
        <div className="h-6 bg-muted rounded w-20"></div>
        <div className="h-6 bg-muted rounded w-16"></div>
        <div className="h-6 bg-muted rounded w-12"></div>
      </div>
    </div>
  );
};

export default PostSkeleton;
