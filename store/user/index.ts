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
      const data = await getMe();

      if (!data) return;

      // Transform the role as in your @Transform decorator
      const roleName = data?.role?.name ?? "";

      set({
        user: {
          id: data.id,
          email: data.email,
          username: data.username,
          avatar: data.avatar,
          role: roleName,
        },
      });
    } catch (err) {
      set({ user: null });
    }
  },
}));
