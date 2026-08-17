import type { MembershipRequest } from "../../groups/types";
import "./MembershipRequestRow.css";

interface MembershipRequestRowProps {
  request: MembershipRequest;
  onApprove: () => void;
  onReject: () => void;
  isBusy: boolean;
}

export function MembershipRequestRow({ request, onApprove, onReject, isBusy }: MembershipRequestRowProps) {
  return (
    <div className="membership-request-row">
      {request.avatarUrl ? (
        <img className="membership-request-row__avatar" src={request.avatarUrl} alt={request.displayName} />
      ) : (
        <div className="membership-request-row__avatar-placeholder">
          {request.displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="membership-request-row__info">
        <div className="membership-request-row__name">{request.displayName}</div>
        <div className="membership-request-row__email">{request.email}</div>
      </div>
      <div className="membership-request-row__actions">
        <button className="membership-request-row__approve" onClick={onApprove} disabled={isBusy}>
          Approve
        </button>
        <button className="membership-request-row__reject" onClick={onReject} disabled={isBusy}>
          Reject
        </button>
      </div>
    </div>
  );
}
