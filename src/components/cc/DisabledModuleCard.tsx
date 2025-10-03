import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock } from "lucide-react";

export default function DisabledModuleCard({ title, desc }:{ title:string; desc:string; }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card aria-disabled="true" className="h-full flex flex-col opacity-60 select-none cursor-not-allowed">
          <CardHeader className="flex-1 flex flex-col gap-3 p-6">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4" aria-hidden />
                <CardTitle className="tracking-tight text-lg leading-tight">{title}</CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                {desc}
              </CardDescription>
            </div>
            <div className="pt-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full px-4 py-2 bg-muted/50 rounded-md text-center text-sm text-muted-foreground border border-dashed cursor-help">
                    <Lock className="inline h-3 w-3 mr-1" aria-hidden />
                    Locked — contact your admin
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={4}>
                  <p>This module requires additional permissions</p>
                  <p className="text-xs opacity-90 mt-1">Contact your administrator to request access</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
        </Card>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        <p className="font-medium">{title}</p>
        <p className="text-xs opacity-90 mt-1">This module is currently locked</p>
        <p className="text-xs opacity-90">Contact your admin for access</p>
      </TooltipContent>
    </Tooltip>
  );
}
