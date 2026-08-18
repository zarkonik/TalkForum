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
}
