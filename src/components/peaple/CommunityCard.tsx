import { Link } from "react-router-dom";
import { Users } from "lucide-react";

interface CommunityCardProps {
  id: string;
  name: string;
  members: number;
  description?: string;
}

const CommunityCard = ({ id, name, members, description }: CommunityCardProps) => {
  return (
    <Link
      to={`/c/${name}`}
      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary transition-colors duration-150 group"
    >
      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
        {name[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground group-hover:underline truncate">
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
