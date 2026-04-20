import localforage from 'localforage';
import { GoalVideo } from '../types';

const VIDEO_STORE_KEY = 'futbol_pro_goal_videos';

export const saveGoalVideo = async (video: GoalVideo): Promise<void> => {
  try {
    const videos = await getGoalVideos();
    const existingIndex = videos.findIndex(v => v.id === video.id);
    if (existingIndex >= 0) {
      videos[existingIndex] = video;
    } else {
      videos.push(video);
    }
    await localforage.setItem(VIDEO_STORE_KEY, videos);
  } catch (error) {
    console.error("Error saving goal video:", error);
  }
};

export const getGoalVideos = async (): Promise<GoalVideo[]> => {
  try {
    const videos = await localforage.getItem<GoalVideo[]>(VIDEO_STORE_KEY);
    return videos || [];
  } catch (error) {
    console.error("Error getting goal videos:", error);
    return [];
  }
};

export const clearGoalVideos = async (): Promise<void> => {
  try {
    await localforage.removeItem(VIDEO_STORE_KEY);
  } catch (error) {
    console.error("Error clearing goal videos:", error);
  }
};
