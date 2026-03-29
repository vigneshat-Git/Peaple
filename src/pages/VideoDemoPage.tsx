import { VideoFeed } from '@/components/video-player';
import { sampleVideos } from '@/components/video-player/data/sampleData';
import { useState } from 'react';

const VideoDemoPage = () => {
  const [startIndex, setStartIndex] = useState(0);

  return (
    <div className="h-screen w-full bg-black">
      <VideoFeed 
        videos={sampleVideos} 
        startIndex={startIndex}
        className="w-full"
      />
      
      {/* Instructions overlay */}
      <div className="fixed top-4 left-4 z-50 bg-black/70 text-white p-4 rounded-lg max-w-sm hidden md:block">
        <h2 className="font-bold mb-2">Video Player Demo</h2>
        <ul className="text-sm space-y-1 text-white/80">
          <li>• Scroll or use ↑↓ arrows to navigate</li>
          <li>• Click video to play/pause</li>
          <li>• Hover for controls</li>
          <li>• On mobile: swipe up for comments</li>
          <li>• Swipe left/right for next/prev</li>
        </ul>
      </div>

      {/* Index selector */}
      <div className="fixed bottom-4 left-4 z-50 flex gap-2">
        {sampleVideos.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setStartIndex(idx)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              startIndex === idx 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-black/70 text-white hover:bg-black/90'
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default VideoDemoPage;
