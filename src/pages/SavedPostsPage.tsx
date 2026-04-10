import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import PostCard from "@/components/peaple/PostCard";
import { PostData } from "@/components/peaple/PostCard";
import { useState } from "react";

const SavedPostsPage = () => {
  const [votes, setVotes] = useState<Record<string, number>>({});

  const { data: savedPosts, isLoading, error } = useQuery({
    queryKey: ['saved-posts'],
    queryFn: async () => {
      const response = await apiService.getSavedPosts();
      return response as PostData[];
    },
  });

  const handleVoteChange = (postId: string, newVotes: number) => {
    setVotes(prev => ({
      ...prev,
      [postId]: newVotes
    }));
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Saved Posts</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Saved Posts</h1>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Failed to load saved posts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Saved Posts</h1>

      {!savedPosts || savedPosts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold mb-2">No saved posts yet</h2>
          <p className="text-muted-foreground">
            Posts you save will appear here for easy access later.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {savedPosts.map((post: PostData) => (
            <PostCard
              key={post.id}
              post={{
                ...post,
                votes: votes[post.id] ?? post.upvotes ?? post.votes ?? 0,
                timeAgo: new Date(post.created_at).toLocaleDateString(),
              }}
              onVoteChange={handleVoteChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPostsPage;