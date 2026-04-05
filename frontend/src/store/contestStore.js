import { create } from 'zustand';

const useContestStore = create((set) => ({
  activeContest: null,
  leaderboard: [],
  setContest: (activeContest) => set({ activeContest }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  updateLeaderboard: (entry) => set((state) => {
    const existing = state.leaderboard.findIndex(e => e.userId === entry.userId);
    if (existing >= 0) {
      const updated = [...state.leaderboard];
      updated[existing] = { ...updated[existing], ...entry };
      return { leaderboard: updated };
    }
    return { leaderboard: [...state.leaderboard, entry] };
  })
}));

export default useContestStore;
