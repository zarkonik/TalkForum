import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../notifications/api";
import { getNotificationLink } from "../../notifications/link";
import type { Notification } from "../../notifications/types";
import { resolveAvatarUrl } from "../../lib/avatar";
import "./NotificationBell.css";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const unreadCountQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
    refetchInterval: 10000,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    enabled: isOpen,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleItemClick(notification: Notification) {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
    const link = getNotificationLink(notification);
    if (link) {
      navigate(link);
    }
    setIsOpen(false);
  }

  const unreadCount = unreadCountQuery.data?.count ?? 0;

  return (
    <div className="notification-bell" ref={containerRef}>
      <button type="button" className="notification-bell__trigger" onClick={() => setIsOpen((v) => !v)}>
        <svg className="notification-bell__icon" viewBox="0 0 24 24">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && <span className="notification-bell__badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-bell__dropdown">
          <div className="notification-bell__header">
            <span className="notification-bell__title">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-bell__mark-all"
                onClick={() => markAllReadMutation.mutate()}
              >
                Mark all as read
              </button>
            )}
          </div>

          {notificationsQuery.data?.length === 0 && (
            <div className="notification-bell__empty">No notifications yet.</div>
          )}

          {notificationsQuery.data?.map((notification) => {
            const avatarUrl = resolveAvatarUrl(notification.actorAvatarUrl);
            return (
              <button
                key={notification.id}
                type="button"
                className={`notification-bell__item${notification.isRead ? "" : " notification-bell__item--unread"}`}
                onClick={() => handleItemClick(notification)}
              >
                {avatarUrl ? (
                  <img className="notification-bell__avatar" src={avatarUrl} alt={notification.actorDisplayName} />
                ) : (
                  <div className="notification-bell__avatar-placeholder">
                    {notification.actorDisplayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="notification-bell__message">{notification.message}</div>
                  <div className="notification-bell__time">{new Date(notification.createdAt).toLocaleString()}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
