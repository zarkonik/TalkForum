import { apiClient } from "../lib/apiClient";
import type { Comment, LikeStatus, Post } from "./types";

export async function fetchPostsByGroup(groupId: string): Promise<Post[]> {
  const { data } = await apiClient.get<Post[]>(`/api/groups/${groupId}/posts`);
  return data;
}

export async function fetchPost(id: string): Promise<Post> {
  const { data } = await apiClient.get<Post>(`/api/posts/${id}`);
  return data;
}

export interface CreatePostInput {
  title: string;
  content: string;
}

export async function createPost(groupId: string, input: CreatePostInput): Promise<Post> {
  const { data } = await apiClient.post<Post>(`/api/groups/${groupId}/posts`, input);
  return data;
}

export async function updatePost(id: string, input: CreatePostInput): Promise<Post> {
  const { data } = await apiClient.put<Post>(`/api/posts/${id}`, input);
  return data;
}

export async function deletePost(id: string): Promise<void> {
  await apiClient.delete(`/api/posts/${id}`);
}

export async function togglePostLike(id: string): Promise<LikeStatus> {
  const { data } = await apiClient.post<LikeStatus>(`/api/posts/${id}/like`);
  return data;
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data } = await apiClient.get<Comment[]>(`/api/posts/${postId}/comments`);
  return data;
}

export interface CreateCommentInput {
  content: string;
  parentCommentId: string | null;
}

export async function createComment(postId: string, input: CreateCommentInput): Promise<Comment> {
  const { data } = await apiClient.post<Comment>(`/api/posts/${postId}/comments`, input);
  return data;
}

export async function updateComment(id: string, content: string): Promise<Comment> {
  const { data } = await apiClient.put<Comment>(`/api/comments/${id}`, { content });
  return data;
}

export async function deleteComment(id: string): Promise<void> {
  await apiClient.delete(`/api/comments/${id}`);
}

export async function toggleCommentLike(id: string): Promise<LikeStatus> {
  const { data } = await apiClient.post<LikeStatus>(`/api/comments/${id}/like`);
  return data;
}
