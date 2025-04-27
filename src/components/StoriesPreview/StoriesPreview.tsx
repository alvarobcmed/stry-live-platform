import React, { useState, useEffect, useRef } from 'react';
import { Story, CompanyStories } from '../../types/story';
import { AdminSettings } from '../../types/admin';
import { getPositionStyles } from '../../utils/position';
import { useVisitorPreferences } from '../../hooks/useVisitorPreferences';

interface StoriesPreviewProps {
  companyStories: CompanyStories;
  onStoryClick: (stories: Story[]) => void;
  position: AdminSettings['previewPosition'];
  size: AdminSettings['previewSize'];
  autoPlay?: boolean;
}

export function StoriesPreview({ 
  companyStories, 
  onStoryClick,
  position,
  size,
  autoPlay = true
}: StoriesPreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const currentStory = companyStories.stories[activeIndex];
  const { visitorPosition } = useVisitorPreferences();

  // Use visitor position if available, otherwise use admin position
  const effectivePosition = visitorPosition || position;

  // Handle story rotation
  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % companyStories.stories.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [companyStories.stories.length, autoPlay]);

  // Handle video playback
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || currentStory.type !== 'video') return;

    // Reset video state
    videoElement.currentTime = 0;
    videoElement.muted = true;

    const playVideo = async () => {
      try {
        await videoElement.play();
      } catch (error) {
        console.warn('Video autoplay failed:', error);
      }
    };

    playVideo();

    return () => {
      try {
        videoElement.pause();
      } catch (error) {
        console.warn('Error pausing video:', error);
      }
    };
  }, [currentStory]);

  return (
    <div 
      ref={previewRef}
      className="fixed bg-black rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-all duration-300 z-50 cursor-pointer"
      style={getPositionStyles(effectivePosition, size)}
      onClick={() => onStoryClick(companyStories.stories)}
    >
      <div className="relative w-full h-full">
        {currentStory.type === 'video' ? (
          <video
            ref={videoRef}
            src={currentStory.url}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            loop
          />
        ) : (
          <img
            src={currentStory.url}
            alt="Story preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
          <div 
            className="h-full bg-white transition-all duration-[5000ms] ease-linear"
            style={{ width: '100%' }}
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <img
              src={companyStories.companyLogo}
              alt={companyStories.companyName}
              className="w-6 h-6 rounded-full border border-white/50"
            />
            <span className="text-white text-sm font-medium truncate">
              {companyStories.companyName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}