import { useRef, useCallback, useEffect } from 'react';

export const useIntroSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);

  const generateAndPlaySound = useCallback(async () => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-sfx`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prompt: "Futuristic digital startup sound, ethereal whoosh building to a warm technological chime, ambient synth pad, cinematic, mysterious energy rising",
            duration: 4,
          }),
        }
      );

      if (!response.ok) {
        // Fail silently - don't break the app if sound generation fails
        console.warn("Failed to generate intro sound - API quota may be exceeded");
        isPlayingRef.current = false;
        return;
      }

      const audioBlob = await response.blob();
      
      // Check if blob is actually audio (not an error JSON response)
      if (audioBlob.type.includes('application/json')) {
        console.warn("Intro sound API returned error response");
        isPlayingRef.current = false;
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audio.volume = 0.3;
      audioRef.current = audio;

      await audio.play();
    } catch (error) {
      // Fail silently - intro sound is non-critical
      console.warn("Intro sound playback failed:", error);
      isPlayingRef.current = false;
    }
  }, []);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSound();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, [stopSound]);

  return { generateAndPlaySound, stopSound };
};
