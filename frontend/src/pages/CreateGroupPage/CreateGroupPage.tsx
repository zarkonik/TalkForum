import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createGroup, fetchCategories, fetchGroups } from "../../groups/api";
import "./CreateGroupPage.css";

export function CreateGroupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [parentGroupId, setParentGroupId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const { data: groups } = useQuery({ queryKey: ["groups", {}], queryFn: () => fetchGroups({}) });
  const topLevelGroups = groups?.filter((g) => g.parentGroupId === null) ?? [];

  const mutation = useMutation({
    mutationFn: createGroup,
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      navigate(`/groups/${group.id}`);
    },
    onError: () => setError("Could not create the group. Please try again."),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate({
      name,
      description,
      categoryId,
      parentGroupId: parentGroupId || null,
    });
  }

  return (
    <div className="create-group__card">
      <h1>Create a group</h1>
      <p className="create-group__subtitle">
        Anyone can create a group. New members must be approved before they can post.
      </p>

      <form className="create-group__form" onSubmit={handleSubmit}>
        <label className="create-group__label" htmlFor="name">
          Name
        </label>
        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />

        <label className="create-group__label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          className="create-group__textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <label className="create-group__label" htmlFor="category">
          Category
        </label>
        <select
          id="category"
          className="create-group__select"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
        >
          <option value="" disabled>
            Select a category
          </option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="create-group__label" htmlFor="parentGroup">
          Parent group (optional)
        </label>
        <select
          id="parentGroup"
          className="create-group__select"
          value={parentGroupId}
          onChange={(e) => setParentGroupId(e.target.value)}
        >
          <option value="">None — this is a top-level group</option>
          {topLevelGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating..." : "Create group"}
        </button>
      </form>
    </div>
  );
}
