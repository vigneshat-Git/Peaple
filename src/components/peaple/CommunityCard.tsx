import { Link } from "react-router-dom";
import { Users } from "lucide-react";

interface CommunityCardProps {
  name: string;
  members: number;
  description?: string;
}

const CommunityCard = ({ name, members, description }: CommunityCardProps) => {
  return (
    <Link
      to={`/c/${name}`}
      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary transition-colors group"
    >
      <div className="h-9 w-9 rounded-lg bg-primary-light flex items-center justify-center text-primary-dark font-bold text-sm">
        {name[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
          c/{name}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3" />
          {members.toLocaleString()} members
        </p>
      </div>
    </Link>
  );
};

export default CommunityCard;
