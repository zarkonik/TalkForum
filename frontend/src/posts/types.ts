export interface Post {
  id: string;
  groupId: string;
  title: string;
  content: string;
  authorId: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
  commentCount: number;
  likeCount: number;
  viewerHasLiked: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  parentCommentId: string | null;
  content: string;
  authorId: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
  likeCount: number;
  viewerHasLiked: boolean;
}

export interface LikeStatus {
  liked: boolean;
  likeCount: number;
}
