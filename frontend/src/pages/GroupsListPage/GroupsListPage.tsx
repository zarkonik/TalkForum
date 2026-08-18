import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { GroupCard } from "../../components/GroupCard/GroupCard";
import { fetchCategories, fetchGroups } from "../../groups/api";
import "./GroupsListPage.css";

export function GroupsListPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  useEffect(() => {
    if (!categoryId && categories && categories.length > 0) {
      const defaultCategory = categories.find((c) => c.name === "Software") ?? categories[0];
      setCategoryId(defaultCategory.id);
    }
  }, [categories, categoryId]);

  const { data: groups, isLoading } = useQuery({
    queryKey: ["groups", { search, categoryId }],
    queryFn: () => fetchGroups({ search: search || undefined, categoryId }),
    enabled: !!categoryId,
  });

  return (
    <div className="groups-list">
      <h1>Groups</h1>

      <div className="groups-list__toolbar">
        <input
          className="groups-list__search"
          type="text"
          placeholder="Search groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="groups-list__select"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {!isLoading && groups?.length === 0 && (
        <p className="groups-list__empty">No groups found. Be the first to create one.</p>
      )}

      <div className="groups-list__grid">
        {groups?.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}
