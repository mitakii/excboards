import { Link } from "react-router-dom";
import { useRecentBoards } from "../queries";

export function RecentBoardsList() {
  const boards = useRecentBoards();

  if (boards.length === 0) {
    return <p className="text-xs text-muted-foreground">No recently opened boards yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {boards.map((board) => (
        <li key={board.id}>
          <Link
            to={`/boards/${board.id}`}
            className="block truncate rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted"
          >
            {board.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
