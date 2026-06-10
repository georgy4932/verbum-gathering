import type { GatheringVisibility } from "@/lib/types/domain";

// Source of truth for "who can see this" copy in the Companion → Gathering
// publish flow. Must match can_see_gathering()'s three branches, which also
// gate the "Threads/Prayer/Replies: select" RLS policies
// (all `can_see_gathering(gathering_id)`):
//   public    → unconditionally true
//   community → auth.uid() IS NOT NULL (any signed-in user, member or not)
//   private   → is_gathering_member(gid) only
export const GATHERING_AUDIENCE_COPY: Record<
  GatheringVisibility,
  { pickerLabel: string; confirmCopy: string }
> = {
  private: {
    pickerLabel: "Private",
    confirmCopy: "Visible only to members of this Gathering.",
  },
  community: {
    pickerLabel: "Community",
    confirmCopy: "Any signed-in VerbumScribe user can view content shared in this Gathering.",
  },
  public: {
    pickerLabel: "Public",
    confirmCopy: "Anyone who can view this Gathering can see the shared copy.",
  },
};
