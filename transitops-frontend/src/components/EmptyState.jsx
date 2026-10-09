import { Inbox } from "lucide-react";
import "./EmptyState.css";

function EmptyState({ title = "Nothing here yet", message = "Records will show up here once they're added." }) {
  return (
    <div className="empty-state">
      <Inbox size={40} />
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}

export default EmptyState;
