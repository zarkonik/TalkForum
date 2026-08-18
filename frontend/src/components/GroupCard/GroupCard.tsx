import { Link } from "react-router-dom";
import type { Group } from "../../groups/types";
import { GROUP_ROLE, MEMBERSHIP_STATUS } from "../../groups/types";
import "./GroupCard.css";

function membershipBadge(viewerRole: number | null, viewerStatus: number | null): string | null {
  if (viewerRole === GROUP_ROLE.OWNER) return "Owner";
  if (viewerRole === GROUP_ROLE.MODERATOR) return "Moderator";
  if (viewerStatus === MEMBERSHIP_STATUS.APPROVED) return "Member";
  if (viewerStatus === MEMBERSHIP_STATUS.PENDING) return "Pending approval";
  return null;
}

export function GroupCard({ group, to }: { group: Group; to?: string }) {
  const badge = membershipBadge(group.viewerRole, group.viewerMembershipStatus);

  return (
    <Link to={to ?? `/groups/${group.id}`} className="group-card">
      <div className="group-card__top">
        <h2 className="group-card__name">{group.name}</h2>
        {badge && <span className="group-card__badge">{badge}</span>}
      </div>
      <p className="group-card__description">{group.description}</p>
      <div className="group-card__meta">
        <span>{group.categoryName}</span>
        <span>
          {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
        </span>
      </div>
    </Link>
  );
}
