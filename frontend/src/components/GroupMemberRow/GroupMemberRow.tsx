import type { GroupMember } from "../../groups/types";
import { GROUP_ROLE } from "../../groups/types";
import { resolveAvatarUrl } from "../../lib/avatar";
import "./GroupMemberRow.css";

function roleLabel(role: number): string {
  if (role === GROUP_ROLE.OWNER) return "Owner";
  if (role === GROUP_ROLE.MODERATOR) return "Moderator";
  return "Member";
}

interface GroupMemberRowProps {
  member: GroupMember;
  onKick: () => void;
  onBan: () => void;
  isBusy: boolean;
}

export function GroupMemberRow({ member, onKick, onBan, isBusy }: GroupMemberRowProps) {
  const avatarUrl = resolveAvatarUrl(member.avatarUrl);
  const isOwner = member.role === GROUP_ROLE.OWNER;

  return (
    <div className="group-member-row">
      {avatarUrl ? (
        <img className="group-member-row__avatar" src={avatarUrl} alt={member.displayName} />
      ) : (
        <div className="group-member-row__avatar-placeholder">{member.displayName.charAt(0).toUpperCase()}</div>
      )}
      <div className="group-member-row__info">
        <div className="group-member-row__name-line">
          <span className="group-member-row__name">{member.displayName}</span>
          <span className="group-member-row__role-badge">{roleLabel(member.role)}</span>
        </div>
        <div className="group-member-row__email">{member.email}</div>
      </div>
      {!isOwner && (
        <div className="group-member-row__actions">
          <button type="button" className="group-member-row__kick" onClick={onKick} disabled={isBusy}>
            Kick
          </button>
          <button type="button" className="group-member-row__ban" onClick={onBan} disabled={isBusy}>
            Ban
          </button>
        </div>
      )}
    </div>
  );
}
