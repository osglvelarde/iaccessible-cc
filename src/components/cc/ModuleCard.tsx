"use client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, ArrowRight } from "lucide-react";
import { pushRecent } from "@/lib/recent-modules";
import { useRouter } from "next/navigation";

export default function ModuleCard({ title, desc, href }:{ title:string; desc:string; href:string; }) {
  const router = useRouter();
  
  const isInternalRoute = href.startsWith('/');
  
  const open = () => { 
    pushRecent(title, href); 
    if (isInternalRoute) {
      router.push(href);
    } else {
      window.open(href,"_blank","noopener,noreferrer"); 
    }
  };
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card role="group" className="h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex-1 flex flex-col gap-3 p-6">
            <div className="flex-1 space-y-2">
              <CardTitle className="tracking-tight text-lg leading-tight">{title}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                {desc}
              </CardDescription>
            </div>
            <div className="pt-2">
              <Button onClick={open} aria-label={`${title} — ${isInternalRoute ? 'navigates to' : 'opens in a new tab'}`} className="w-full">
                Open {isInternalRoute ? <ArrowRight className="ms-2 h-4 w-4" aria-hidden /> : <ExternalLink className="ms-2 h-4 w-4" aria-hidden />}
              </Button>
            </div>
          </CardHeader>
        </Card>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        <p className="font-medium">{title}</p>
        <p className="text-xs opacity-90 mt-1">
          {isInternalRoute ? 'Click to navigate to this module' : 'Click to open in a new tab'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
