const CommentSkeleton = () => {
  return (
    <div className="py-2 px-2 -mx-2 animate-pulse">
      {/* Header: Avatar, Username, Time */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 bg-muted rounded-full"></div>
        <div className="h-3 bg-muted rounded w-20"></div>
        <div className="h-3 bg-muted rounded w-1"></div>
        <div className="h-3 bg-muted rounded w-12"></div>
      </div>

      {/* Content lines */}
      <div className="space-y-1.5 mb-2">
        <div className="h-3 bg-muted rounded w-full"></div>
        <div className="h-3 bg-muted rounded w-4/5"></div>
      </div>

      {/* Footer: Vote, Reply */}
      <div className="flex items-center gap-3">
        <div className="h-6 bg-muted rounded w-16"></div>
        <div className="h-6 bg-muted rounded w-12"></div>
      </div>
    </div>
  );
};

export default CommentSkeleton;
