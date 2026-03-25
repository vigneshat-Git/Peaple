import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  name: string;
  image?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-14 w-14 text-lg",
};

const UserAvatar = ({ name, image, size = "md" }: UserAvatarProps) => {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Avatar className={sizeClasses[size]}>
      {image && <AvatarImage src={image} alt={name} />}
      <AvatarFallback className="bg-secondary text-foreground font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
