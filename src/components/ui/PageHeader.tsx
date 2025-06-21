
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  addButtonLink?: string;
  addButtonText?: string;
  backButtonLink?: string;
  children?: ReactNode;
}

const PageHeader = ({ 
  title, 
  addButtonLink, 
  addButtonText = "Ajouter",
  backButtonLink,
  children 
}: PageHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        {backButtonLink && (
          <Link to={backButtonLink} className="mr-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft size={16} />
            </Button>
          </Link>
        )}
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {children}
        {addButtonLink && (
          <Link to={addButtonLink}>
            <Button className="flex items-center gap-1">
              <Plus size={18} />
              <span>{addButtonText}</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
