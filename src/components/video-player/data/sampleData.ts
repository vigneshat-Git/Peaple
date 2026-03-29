import { VideoData } from '../types';

export const sampleVideos: VideoData[] = [
  {
    id: '1',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    title: 'Big Buck Bunny - Open Movie Project',
    description: 'A giant rabbit with a heart bigger than himself. When one sunny day three rodents rudely harass him, something snaps... and the bunny goes mad!',
    author: {
      id: 'user1',
      username: 'openmovies',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=openmovies',
    },
    community: {
      id: 'comm1',
      name: 'movies',
    },
    likes: 15420,
    dislikes: 230,
    saves: 3400,
    shares: 1200,
    createdAt: '2024-03-15T10:30:00Z',
    comments: [
      {
        id: 'c1',
        content: 'This is such a classic! Love the animation quality.',
        author: {
          id: 'u2',
          username: 'animelover',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=animelover',
        },
        createdAt: '2024-03-15T12:00:00Z',
        likes: 45,
        replies: [
          {
            id: 'c1r1',
            content: 'Totally agree! The fur rendering is incredible.',
            author: {
              id: 'u3',
              username: 'techartist',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=techartist',
            },
            createdAt: '2024-03-15T13:30:00Z',
            likes: 12,
          },
        ],
      },
      {
        id: 'c2',
        content: 'Does anyone know what software they used for this?',
        author: {
          id: 'u4',
          username: 'curious_dev',
        },
        createdAt: '2024-03-16T09:00:00Z',
        likes: 8,
      },
    ],
  },
  {
    id: '2',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
    title: "Elephants Dream - World's First Open Movie",
    description: 'The world\'s first open movie, made entirely with open source graphics software such as Blender.',
    author: {
      id: 'user2',
      username: 'blenderfoundation',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=blender',
    },
    community: {
      id: 'comm2',
      name: 'opensource',
    },
    likes: 8930,
    dislikes: 120,
    saves: 2100,
    shares: 890,
    createdAt: '2024-03-14T15:45:00Z',
    comments: [
      {
        id: 'c3',
        content: 'Mind-bending visuals! The atmosphere is so unique.',
        author: {
          id: 'u5',
          username: 'scifi_fan',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=scifi',
        },
        createdAt: '2024-03-14T18:00:00Z',
        likes: 67,
      },
      {
        id: 'c4',
        content: 'I remember watching this when it first came out in 2006!',
        author: {
          id: 'u6',
          username: 'veteran_animator',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=veteran',
        },
        createdAt: '2024-03-15T08:30:00Z',
        likes: 23,
      },
      {
        id: 'c5',
        content: 'The sound design is incredible too.',
        author: {
          id: 'u7',
          username: 'audiophile',
        },
        createdAt: '2024-03-15T14:20:00Z',
        likes: 15,
      },
    ],
  },
  {
    id: '3',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
    title: 'For Bigger Blazes - Chromecast Demo',
    description: 'HBO GO now supports Chromecast. Watch your favorite shows on the big screen.',
    author: {
      id: 'user3',
      username: 'techreviews',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tech',
    },
    community: {
      id: 'comm3',
      name: 'technology',
    },
    likes: 5420,
    dislikes: 89,
    saves: 1200,
    shares: 560,
    createdAt: '2024-03-13T11:20:00Z',
    comments: [
      {
        id: 'c6',
        content: 'Still relevant after all these years!',
        author: {
          id: 'u8',
          username: 'streaming_pro',
        },
        createdAt: '2024-03-13T14:00:00Z',
        likes: 34,
      },
    ],
  },
  {
    id: '4',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg',
    title: 'Tears of Steel - Sci-Fi Short Film',
    description: 'A group of warriors and scientists gather at the Oude Kerk in Amsterdam to stage a crucial event from the past.',
    author: {
      id: 'user4',
      username: 'mangoopenmovie',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mango',
    },
    community: {
      id: 'comm4',
      name: 'scifi',
    },
    likes: 12500,
    dislikes: 340,
    saves: 4500,
    shares: 2300,
    createdAt: '2024-03-12T16:00:00Z',
    comments: [
      {
        id: 'c7',
        content: 'The VFX work here is absolutely stunning for an open movie project.',
        author: {
          id: 'u9',
          username: 'vfx_artist',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vfx',
        },
        createdAt: '2024-03-12T19:30:00Z',
        likes: 89,
        replies: [
          {
            id: 'c7r1',
            content: 'Right? The compositing is on par with Hollywood productions.',
            author: {
              id: 'u10',
              username: 'comp_wizard',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=comp',
            },
            createdAt: '2024-03-12T21:00:00Z',
            likes: 45,
          },
        ],
      },
      {
        id: 'c8',
        content: 'Amsterdam never looked so dystopian!',
        author: {
          id: 'u11',
          username: 'traveler_nl',
        },
        createdAt: '2024-03-13T10:00:00Z',
        likes: 28,
      },
    ],
  },
  {
    id: '5',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
    title: 'Sintel - Fantasy Animation',
    description: 'A lonely young woman, Sintel, helps and befriends a dragon, whom she calls Scales.',
    author: {
      id: 'user5',
      username: 'durianproject',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=durian',
    },
    community: {
      id: 'comm5',
      name: 'fantasy',
    },
    likes: 18200,
    dislikes: 450,
    saves: 5600,
    shares: 3100,
    createdAt: '2024-03-11T09:15:00Z',
    comments: [
      {
        id: 'c9',
        content: 'This made me cry at the end. Such a beautiful story.',
        author: {
          id: 'u12',
          username: 'story_lover',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=story',
        },
        createdAt: '2024-03-11T12:00:00Z',
        likes: 156,
        replies: [
          {
            id: 'c9r1',
            content: 'Same here! The emotional arc is perfect.',
            author: {
              id: 'u13',
              username: 'emotional_viewer',
            },
            createdAt: '2024-03-11T14:30:00Z',
            likes: 34,
          },
          {
            id: 'c9r2',
            content: 'The soundtrack really amplifies the feels too.',
            author: {
              id: 'u14',
              username: 'music_enthusiast',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=music',
            },
            createdAt: '2024-03-11T16:00:00Z',
            likes: 22,
          },
        ],
      },
    ],
  },
];
