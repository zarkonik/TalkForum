import { useQuery } from "@tanstack/react-query";
import { GroupCard } from "../../components/GroupCard/GroupCard";
import { fetchMyGroups } from "../../groups/api";
import { GROUP_ROLE } from "../../groups/types";
import "./MyGroupsPage.css";

export function MyGroupsPage() {
  const { data: groups, isLoading } = useQuery({
    queryKey: ["groups", "mine"],
    queryFn: fetchMyGroups,
  });

  return (
    <div>
      <h1>My groups</h1>

      {!isLoading && groups?.length === 0 && (
        <p className="my-groups-page__empty">You haven't joined any groups yet.</p>
      )}

      <div className="my-groups-page__grid">
        {groups?.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            to={group.viewerRole === GROUP_ROLE.OWNER ? `/groups/${group.id}/admin` : `/groups/${group.id}`}
          />
        ))}
      </div>
    </div>
  );
}
