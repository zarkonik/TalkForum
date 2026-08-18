import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { MembershipRequestRow } from "../../components/MembershipRequestRow/MembershipRequestRow";
import { PostCard } from "../../components/PostCard/PostCard";
import {
  approveMembershipRequest,
  fetchGroup,
  fetchMembershipRequests,
  rejectMembershipRequest,
  requestToJoinGroup,
} from "../../groups/api";
import { GROUP_ROLE, MEMBERSHIP_STATUS } from "../../groups/types";
import { fetchPostsByGroup } from "../../posts/api";
import "./GroupDetailPage.css";

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const groupQuery = useQuery({
    queryKey: ["groups", id],
    queryFn: () => fetchGroup(id!),
    enabled: !!id,
  });

  const group = groupQuery.data;
  const isOwnerOrModerator = group?.viewerRole === GROUP_ROLE.OWNER || group?.viewerRole === GROUP_ROLE.MODERATOR;
  const isApprovedMember = group?.viewerMembershipStatus === MEMBERSHIP_STATUS.APPROVED;

  const requestsQuery = useQuery({
    queryKey: ["groups", id, "requests"],
    queryFn: () => fetchMembershipRequests(id!),
    enabled: !!id && isOwnerOrModerator,
  });

  const postsQuery = useQuery({
    queryKey: ["groups", id, "posts"],
    queryFn: () => fetchPostsByGroup(id!),
    enabled: !!id && isApprovedMember,
  });

  const joinMutation = useMutation({
    mutationFn: () => requestToJoinGroup(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups", id] }),
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => approveMembershipRequest(id!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", id, "requests"] });
      queryClient.invalidateQueries({ queryKey: ["groups", id] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: string) => rejectMembershipRequest(id!, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups", id, "requests"] }),
  });

  if (groupQuery.isLoading || !group) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <div className="group-detail__header">
        <div className="group-detail__top">
          <div>
            <span className="group-detail__category">{group.categoryName}</span>
            <h1>{group.name}</h1>
          </div>

          {group.viewerMembershipStatus === null && (
            <button className="btn-primary" onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
              {joinMutation.isPending ? "Requesting..." : "Request to join"}
            </button>
          )}
          {group.viewerMembershipStatus === MEMBERSHIP_STATUS.PENDING && (
            <span className="group-detail__status">Pending approval</span>
          )}
        </div>

        <p className="group-detail__description">{group.description}</p>
        <p className="group-detail__meta">
          {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
        </p>
      </div>

      {isOwnerOrModerator && (
        <div className="group-detail__section">
          <div className="group-detail__section-title">Pending requests</div>
          {requestsQuery.data?.length === 0 && <p>No pending requests.</p>}
          {requestsQuery.data?.map((request) => (
            <MembershipRequestRow
              key={request.userId}
              request={request}
              isBusy={approveMutation.isPending || rejectMutation.isPending}
              onApprove={() => approveMutation.mutate(request.userId)}
              onReject={() => rejectMutation.mutate(request.userId)}
            />
          ))}
        </div>
      )}

      {isApprovedMember && (
        <div className="group-detail__posts">
          <div className="group-detail__posts-header">
            <div className="group-detail__section-title">Posts</div>
            <Link className="btn-secondary" to={`/groups/${id}/posts/new`}>
              New post
            </Link>
          </div>

          {postsQuery.data?.length === 0 && <p>No posts yet. Start the conversation.</p>}

          <div className="group-detail__posts-list">
            {postsQuery.data?.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
