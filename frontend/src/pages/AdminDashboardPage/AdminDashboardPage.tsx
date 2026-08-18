import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  adminDeleteComment,
  adminDeleteGroup,
  adminDeletePost,
  banUser,
  fetchAdminGroups,
  fetchAdminUsers,
  unbanUser,
} from "../../admin/api";
import { resolveAvatarUrl } from "../../lib/avatar";
import { dismissReport, fetchPendingReports, resolveReport } from "../../reports/api";
import { REPORT_TARGET_TYPE } from "../../reports/types";
import "./AdminDashboardPage.css";

function reportTargetLabel(targetType: number): string {
  if (targetType === REPORT_TARGET_TYPE.POST) return "Post";
  if (targetType === REPORT_TARGET_TYPE.COMMENT) return "Comment";
  return "Group";
}

export function AdminDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const reportsQuery = useQuery({ queryKey: ["admin", "reports"], queryFn: fetchPendingReports });
  const usersQuery = useQuery({ queryKey: ["admin", "users"], queryFn: fetchAdminUsers });
  const groupsQuery = useQuery({ queryKey: ["admin", "groups"], queryFn: fetchAdminGroups });

  const resolveMutation = useMutation({
    mutationFn: resolveReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "reports"] }),
  });

  const dismissMutation = useMutation({
    mutationFn: dismissReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "reports"] }),
  });

  const deleteContentMutation = useMutation({
    mutationFn: ({ targetType, targetId }: { targetType: number; targetId: string }) => {
      if (targetType === REPORT_TARGET_TYPE.POST) return adminDeletePost(targetId);
      if (targetType === REPORT_TARGET_TYPE.COMMENT) return adminDeleteComment(targetId);
      return adminDeleteGroup(targetId);
    },
  });

  const banMutation = useMutation({
    mutationFn: banUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const unbanMutation = useMutation({
    mutationFn: unbanUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: adminDeleteGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "groups"] }),
  });

  if (!user?.isPlatformAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page-container">
      <h1>Admin dashboard</h1>

      <div className="admin-dashboard__section">
        <div className="admin-dashboard__section-title">
          Pending reports ({reportsQuery.data?.length ?? 0})
        </div>
        {reportsQuery.data?.length === 0 && <p>No pending reports.</p>}
        {reportsQuery.data?.map((report) => (
          <div key={report.id} className="admin-dashboard__row">
            <div className="admin-dashboard__info">
              <div className="admin-dashboard__name-line">
                <span className="admin-dashboard__badge">{reportTargetLabel(report.targetType)}</span>
                <span>{report.targetPreview}</span>
              </div>
              <div className="admin-dashboard__meta">
                Reported by {report.reporterDisplayName}
                {report.reason ? ` — "${report.reason}"` : ""}
              </div>
            </div>
            <div className="admin-dashboard__actions">
              <button
                type="button"
                className="admin-dashboard__btn admin-dashboard__btn--danger"
                disabled={deleteContentMutation.isPending}
                onClick={() => {
                  if (confirm("Delete the reported content?")) {
                    deleteContentMutation.mutate({ targetType: report.targetType, targetId: report.targetId });
                  }
                }}
              >
                Delete content
              </button>
              <button
                type="button"
                className="admin-dashboard__btn"
                disabled={resolveMutation.isPending}
                onClick={() => resolveMutation.mutate(report.id)}
              >
                Resolve
              </button>
              <button
                type="button"
                className="admin-dashboard__btn"
                disabled={dismissMutation.isPending}
                onClick={() => dismissMutation.mutate(report.id)}
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-dashboard__section">
        <div className="admin-dashboard__section-title">Users ({usersQuery.data?.length ?? 0})</div>
        {usersQuery.data?.map((u) => {
          const avatarUrl = resolveAvatarUrl(u.avatarUrl);
          return (
            <div key={u.id} className="admin-dashboard__row">
              {avatarUrl ? (
                <img className="admin-dashboard__avatar" src={avatarUrl} alt={u.displayName} />
              ) : (
                <div className="admin-dashboard__avatar-placeholder">{u.displayName.charAt(0).toUpperCase()}</div>
              )}
              <div className="admin-dashboard__info">
                <div className="admin-dashboard__name-line">
                  <span>{u.displayName}</span>
                  {u.isPlatformAdmin && <span className="admin-dashboard__badge">Admin</span>}
                  {u.isBanned && <span className="admin-dashboard__badge admin-dashboard__badge--danger">Banned</span>}
                </div>
                <div className="admin-dashboard__meta">{u.email}</div>
              </div>
              {!u.isPlatformAdmin && (
                <div className="admin-dashboard__actions">
                  {u.isBanned ? (
                    <button
                      type="button"
                      className="admin-dashboard__btn"
                      disabled={unbanMutation.isPending}
                      onClick={() => unbanMutation.mutate(u.id)}
                    >
                      Unban
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-dashboard__btn admin-dashboard__btn--danger"
                      disabled={banMutation.isPending}
                      onClick={() => {
                        if (confirm(`Ban ${u.displayName} from the entire site?`)) {
                          banMutation.mutate(u.id);
                        }
                      }}
                    >
                      Ban
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="admin-dashboard__section">
        <div className="admin-dashboard__section-title">Groups ({groupsQuery.data?.length ?? 0})</div>
        {groupsQuery.data?.map((g) => (
          <div key={g.id} className="admin-dashboard__row">
            <div className="admin-dashboard__info">
              <div className="admin-dashboard__name-line">
                <span>{g.name}</span>
                <span className="admin-dashboard__badge">{g.categoryName}</span>
              </div>
              <div className="admin-dashboard__meta">
                Owner: {g.ownerDisplayName} · {g.memberCount} {g.memberCount === 1 ? "member" : "members"}
              </div>
            </div>
            <div className="admin-dashboard__actions">
              <button
                type="button"
                className="admin-dashboard__btn admin-dashboard__btn--danger"
                disabled={deleteGroupMutation.isPending}
                onClick={() => {
                  if (confirm(`Delete group "${g.name}" and all its content?`)) {
                    deleteGroupMutation.mutate(g.id);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
