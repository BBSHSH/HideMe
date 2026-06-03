import type React from "react";

export interface Badge {
  type: string;
  icon: string;
  style: React.CSSProperties;
}

export interface VideoCardData {
  id: number;
  title: string;
  channel: string;
  views: string;
  time: string;
  duration: string;
  category: string;
  badge?: Badge;
  imgSrc: string;
  avatarSrc: string;
}

export interface Category {
  label: string;
  value: string;
}

export const categoryData: Category[] = [
  { label: "All", value: "All" },
  { label: "Valorant", value: "Valorant" },
  { label: "Overwatch", value: "Overwatch" },
  { label: "Minecraft", value: "Minecraft" },
  { label: "Tutorials", value: "Tutorials" },
  { label: "Security Logs", value: "Security Logs" },
  { label: "Cryptography", value: "Cryptography" },
  { label: "Live", value: "Live" },
];

export const videoAssetData: VideoCardData[] = [
  {
    id: 1,
    title: "Valorant Ace - S6 Ranked Match Highlight",
    channel: "GhostOps Gaming",
    views: "1.2M views",
    time: "2 hours ago",
    duration: "10:42",
    category: "Valorant",
    badge: {
      type: "SECURE",
      icon: "verified_user",
      style: {
        background: "rgba(74, 222, 128, 0.2)",
        color: "#4ade80",
        borderColor: "rgba(74, 222, 128, 0.4)",
      },
    },
    imgSrc: "https://lh3.googleusercontent.com/aida-public/AB6AXuB08z0GAX_Uf8UJcc7GIzdzy11tZh9Xmw4Dh5IDO4OgafYPye5NFgmAan3cT1s4NRqgcXlso0rMnsjU7w7kt1AEyvL9Dom2s4Y0KDX15SsYEBxkHVAZW287-k7tqMc4rjqCLvexK0L9JSidMPiXp-XUt8spFnJXZ2SWzDvWsSqIWFYPi7SNsBV16M-wfSnml2LOXkDixnLmBSotDeGaN4_ITPVKIw6D5O97izDXKMszZxCnPj1s6hgj3ELZTB9UJjss8dCMcSoinGbC",
    avatarSrc: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgO09Mvp3Tanir-X8stJF2BNkVEE7N8vMNIytfaKM8uc7QL1BPhYxYnDK-026123hDeVtl5Lr5itYU3p1FIPUAKOt-rpINoTxvr77ouwaYmqOqpvbS-PLt9d5yntEkC46eBuABbnodNB_dhCc_Px2AQLLAhUx-pdImO5WBz_tRxgTKdRs4pcQq5CoICpP5ntB75_IqiKATi3zde_9oTBlkiktHFZSwplWkBJS2lOjiGyWLDWwLSde-DEq4JHywk-v-CPM-hjXjFdx4",
  },
  {
    id: 2,
    title: "Encryption Protocol Explained: RSA vs AES",
    channel: "CyberShield Network",
    views: "450K views",
    time: "5 hours ago",
    duration: "24:15",
    category: "Cryptography",
    badge: {
      type: "SECURE",
      icon: "verified_user",
      style: {
        background: "rgba(74, 222, 128, 0.2)",
        color: "#4ade80",
        borderColor: "rgba(74, 222, 128, 0.4)",
      },
    },
    imgSrc: "https://lh3.googleusercontent.com/aida-public/AB6AXuANnTbC83WHKfH-GVJK0PDDXeyyRAy9VdyiJhnOh16o_J5j678fHxDQgVLBDemTuWzqxgfnDe663FHpqe2WOdR_u0fC2M-4mc69DRxgl0r0QW7-NVK0enl3XWkFiSZ-FBhoUc24KeKtPmu_tF3lpQnnzHEaKjlldtia29I3zJ05WYyMra9f7FxSjvJW3B24w7TimQtLBAA6FS48NUSrnIBx4ffSHwvMhocEZKTPCXotYXNIuiR8Ll-Ph7G6uZ_M1XuN2SlZ7pFoPhEJ",
    avatarSrc: "https://lh3.googleusercontent.com/aida-public/AB6AXuAiR1FckkK8pnyj-KMeHo3izFEIoFFvGeeqInda9qqJHFNAHkCq36VDjEzEqH5p1lxtn70nOwupzjBj50WelTJIRCMV7y5IYqPDcctnUSWeNNUwWocxJLKxy2DadXayzQNzK52RV7XQteIQGoe0Y3UlsjkR6gLq1hntDcS79HYIHyWFWH3uAT050gNB6qzfSf8sawAn621WQOBJFKSD9hDfezc3uXzcOdASgeKJ-reFIBjuQH5oKevRguPtGpFaKEWozboEX6VPNCMf",
  },
];