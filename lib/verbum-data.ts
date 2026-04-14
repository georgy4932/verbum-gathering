export type LiveRoom = {
  slug: string;
  title: string;
  description: string;
  status: "live" | "soon" | "scheduled";
  timeLabel: string;
  host: string;
  kind: "prayer" | "worship" | "study";
};

export type FellowshipRoom = {
  slug: string;
  name: string;
  description: string;
  membersLabel: string;
};

export const liveRooms: LiveRoom[] = [
  {
    slug: "evening-prayer",
    title: "Evening Prayer",
    description: "A quiet live space for Scripture, intercession, and shared prayer.",
    status: "live",
    timeLabel: "Live now",
    host: "Verbum Prayer Team",
    kind: "prayer",
  },
  {
    slug: "worship-room",
    title: "Worship Room",
    description: "A space for sacred music, stillness, and worship together.",
    status: "soon",
    timeLabel: "Starting in 20 minutes",
    host: "Verbum Worship",
    kind: "worship",
  },
  {
    slug: "james-1-study",
    title: "Bible Study: James 1",
    description: "Read, reflect, and grow deeper in the Word with guided teaching.",
    status: "scheduled",
    timeLabel: "Tonight at 8:00 PM",
    host: "Study Circle",
    kind: "study",
  },
];

export const fellowshipRooms: FellowshipRoom[] = [
  {
    slug: "prayer-room",
    name: "Prayer Room",
    description: "Share requests, stand together in faith, and encourage one another.",
    membersLabel: "184 gathering",
  },
  {
    slug: "young-adults",
    name: "Young Adults",
    description: "Encouragement, Scripture, and fellowship for younger believers.",
    membersLabel: "76 gathering",
  },
  {
    slug: "testimony-room",
    name: "Testimony Room",
    description: "Share what God has done and strengthen others through testimony.",
    membersLabel: "52 gathering",
  },
  {
    slug: "bible-study-circle",
    name: "Bible Study Circle",
    description: "Discuss passages, ask questions, and grow together in the Word.",
    membersLabel: "91 gathering",
  },
];

export const todayDevotion = {
  title: "Walk in the light you have",
  scripture: "\u201cYour word is a lamp to my feet and a light to my path.\u201d \u2014 Psalm 119:105",
  reflection: "God often gives enough light for the next faithful step, not the full road ahead. Stay near the Word, and walk in what He has already shown you.",
  prayer: "Lord, steady my heart today. Help me obey what You have made clear, trust You with what I cannot yet see, and remain close to Your Word. Amen.",
};
