import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { GroupCard } from "../../components/GroupCard/GroupCard";
import { fetchCategories, fetchGroups } from "../../groups/api";
import "./DiscoveryPage.css";

export function DiscoveryPage() {
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: groups, isLoading } = useQuery({
    queryKey: ["groups", { search, categoryId: activeCategoryId }],
    queryFn: () => fetchGroups({ search: search || undefined, categoryId: activeCategoryId ?? undefined }),
  });

  return (
    <div>
      <h1>Discover groups</h1>

      <input
        className="discovery-page__search"
        type="text"
        placeholder="Search all groups by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="discovery-page__categories">
        <button
          type="button"
          className={`discovery-page__category-chip${activeCategoryId === null ? " discovery-page__category-chip--active" : ""}`}
          onClick={() => setActiveCategoryId(null)}
        >
          All
        </button>
        {categories?.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`discovery-page__category-chip${activeCategoryId === c.id ? " discovery-page__category-chip--active" : ""}`}
            onClick={() => setActiveCategoryId(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {!isLoading && groups?.length === 0 && (
        <p className="discovery-page__empty">No groups found.</p>
      )}

      <div className="discovery-page__grid">
        {groups?.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}
