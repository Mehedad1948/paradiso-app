import { getMe } from "@/app/actions/users/getMe";
import { User } from "@/types/user";
import { create } from "zustand";

type UserState = {
  user: User | null;
  setUser: (user: User | null) => void;
  fetchMe: () => Promise<void>;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  fetchMe: async () => {
    try {
      const { result } = await getMe();

      if (!result) return;

      // Transform the role as in your @Transform decorator
      const roleName = result?.role ?? "";

      set({
        user: {
          id: result.id,
          email: result.email,
          username: result.username,
          avatar: result.avatar,
          role: roleName,
        },
      });
    } catch (err) {
      set({ user: null });
    }
  },
}));
