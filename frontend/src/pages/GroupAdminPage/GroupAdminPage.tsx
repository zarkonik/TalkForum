import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";
import { MembershipRequestRow } from "../../components/MembershipRequestRow/MembershipRequestRow";
import { GroupMemberRow } from "../../components/GroupMemberRow/GroupMemberRow";
import { PostCard } from "../../components/PostCard/PostCard";
import {
  approveMembershipRequest,
  banGroupMember,
  fetchGroup,
  fetchGroupMembers,
  fetchMembershipRequests,
  kickGroupMember,
  rejectMembershipRequest,
} from "../../groups/api";
import { GROUP_ROLE } from "../../groups/types";
import { fetchPostsByGroup } from "../../posts/api";
import "./GroupAdminPage.css";

export function GroupAdminPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const groupQuery = useQuery({
    queryKey: ["groups", id],
    queryFn: () => fetchGroup(id!),
    enabled: !!id,
  });

  const isOwnerOrModerator =
    groupQuery.data?.viewerRole === GROUP_ROLE.OWNER || groupQuery.data?.viewerRole === GROUP_ROLE.MODERATOR;

  const requestsQuery = useQuery({
    queryKey: ["groups", id, "requests"],
    queryFn: () => fetchMembershipRequests(id!),
    enabled: !!id && isOwnerOrModerator,
  });

  const membersQuery = useQuery({
    queryKey: ["groups", id, "members"],
    queryFn: () => fetchGroupMembers(id!),
    enabled: !!id && isOwnerOrModerator,
  });

  const postsQuery = useQuery({
    queryKey: ["groups", id, "posts"],
    queryFn: () => fetchPostsByGroup(id!),
    enabled: !!id && isOwnerOrModerator,
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => approveMembershipRequest(id!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", id, "requests"] });
      queryClient.invalidateQueries({ queryKey: ["groups", id, "members"] });
      queryClient.invalidateQueries({ queryKey: ["groups", id] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: string) => rejectMembershipRequest(id!, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups", id, "requests"] }),
  });

  const kickMutation = useMutation({
    mutationFn: (userId: string) => kickGroupMember(id!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", id, "members"] });
      queryClient.invalidateQueries({ queryKey: ["groups", id] });
    },
  });

  const banMutation = useMutation({
    mutationFn: (userId: string) => banGroupMember(id!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", id, "members"] });
      queryClient.invalidateQueries({ queryKey: ["groups", id] });
    },
  });

  if (groupQuery.isLoading) {
    return <p>Loading...</p>;
  }

  if (!groupQuery.data || !isOwnerOrModerator) {
    return <Navigate to={`/groups/${id}`} replace />;
  }

  const isBusy = kickMutation.isPending || banMutation.isPending;

  return (
    <div className="page-container">
      <div className="group-admin__header">
        <div className="group-admin__header-top">
          <div>
            <h1>Admin panel</h1>
            <p className="group-admin__subtitle">{groupQuery.data.name}</p>
          </div>
          <Link className="btn-secondary" to={`/groups/${id}/leaderboard`}>
            Leaderboard
          </Link>
        </div>
      </div>

      <div className="group-admin__section">
        <div className="group-admin__posts-header">
          <div className="group-admin__section-title">Posts</div>
          <Link className="btn-secondary" to={`/groups/${id}/posts/new`}>
            New post
          </Link>
        </div>
        {postsQuery.data?.length === 0 && <p>No posts yet.</p>}
        <div className="group-admin__posts-list">
          {postsQuery.data?.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>

      <div className="group-admin__section">
        <div className="group-admin__section-title">Pending requests</div>
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

      <div className="group-admin__section">
        <div className="group-admin__section-title">
          Members ({membersQuery.data?.length ?? 0})
        </div>
        {membersQuery.data?.map((member) => (
          <GroupMemberRow
            key={member.userId}
            member={member}
            isBusy={isBusy}
            onKick={() => {
              if (confirm(`Remove ${member.displayName} from the group?`)) {
                kickMutation.mutate(member.userId);
              }
            }}
            onBan={() => {
              if (confirm(`Ban ${member.displayName} from the group? They will not be able to rejoin.`)) {
                banMutation.mutate(member.userId);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
