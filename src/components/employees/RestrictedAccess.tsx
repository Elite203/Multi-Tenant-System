import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock } from "lucide-react";

interface RestrictedAccessProps {
  title?: string;
  message?: string;
}

export const RestrictedAccess = ({ 
  title = "Access Restricted", 
  message = "You don't have permission to view this information. Please contact your administrator if you need access." 
}: RestrictedAccessProps) => {
  return (
    <Card className="shadow-soft">
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Shield className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" />
              {title}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};