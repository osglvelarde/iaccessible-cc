"use client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Type, Image, Palette, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Font {
  name: string;
  type: string;
  embedded: boolean;
  subset: boolean;
  unicodeCoverage: number;
}

interface ImageInfo {
  page: number;
  dimensions: string;
  dpi: number;
  colorSpace: string;
  hasAltText: boolean;
}

interface FontGraphicsAnalysis {
  fonts: Font[];
  images: ImageInfo[];
  iccProfiles: number;
  transparencyUsage: boolean;
}

interface PdfFontGraphicsAnalysisProps {
  analysis: FontGraphicsAnalysis;
  className?: string;
}

export default function PdfFontGraphicsAnalysis({ analysis, className }: PdfFontGraphicsAnalysisProps) {
  const getFontTypeColor = (type: string) => {
    switch (type) {
      case "TrueType": return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700";
      case "Type1": return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700";
      case "CID": return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700";
      default: return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getUnicodeCoverageColor = (coverage: number) => {
    if (coverage >= 95) return "text-green-600";
    if (coverage >= 80) return "text-amber-600";
    return "text-red-600";
  };

  const getUnicodeCoverageBadge = (coverage: number) => {
    if (coverage >= 95) return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700";
    if (coverage >= 80) return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700";
    return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700";
  };

  const getColorSpaceColor = (colorSpace: string) => {
    switch (colorSpace) {
      case "RGB": return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700";
      case "CMYK": return "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-700";
      case "Grayscale": return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700";
      default: return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700";
    }
  };

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          Font & Graphics Analysis
        </CardTitle>
        <CardDescription>
          Detailed analysis of fonts, images, and graphics used in the PDF
        </CardDescription>
      </CardHeader>
      <div className="p-6 pt-0">
        <div className="space-y-6">
          {/* Font Analysis */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Type className="h-4 w-4" />
              Font Inventory ({analysis.fonts.length} fonts)
            </div>
            <div className="space-y-2">
              {analysis.fonts.map((font, index) => (
                <div key={index} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{font.name}</span>
                      <Badge variant="outline" className={getFontTypeColor(font.type)}>
                        {font.type}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "flex items-center gap-1",
                              font.embedded 
                                ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
                                : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"
                            )}
                          >
                            {font.embedded ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {font.embedded ? "Embedded" : "Not Embedded"}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{font.embedded ? "Font is embedded in the PDF" : "Font is not embedded - may cause display issues"}</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "flex items-center gap-1",
                              font.subset 
                                ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700"
                                : "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700"
                            )}
                          >
                            {font.subset ? "Subset" : "Full"}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{font.subset ? "Font is subsetted (optimized)" : "Full font is included"}</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge 
                            variant="outline" 
                            className={getUnicodeCoverageBadge(font.unicodeCoverage)}
                          >
                            {font.unicodeCoverage}% Unicode
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Unicode character coverage for this font</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image Analysis */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Image className="h-4 w-4" />
              Image Analysis ({analysis.images.length} images)
            </div>
            <div className="space-y-2">
              {analysis.images.map((image, index) => (
                <div key={index} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Page {image.page}</span>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
                        {image.dimensions}
                      </Badge>
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700">
                        {image.dpi} DPI
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={getColorSpaceColor(image.colorSpace)}>
                        {image.colorSpace}
                      </Badge>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "flex items-center gap-1",
                              image.hasAltText 
                                ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
                                : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"
                            )}
                          >
                            {image.hasAltText ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            Alt Text
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{image.hasAltText ? "Image has alternative text" : "Image missing alternative text"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Graphics Summary */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Palette className="h-4 w-4" />
              Graphics Summary
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ICC Profiles</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
                    {analysis.iccProfiles}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Color management profiles embedded
                </p>
              </div>
              
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Transparency</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "flex items-center gap-1",
                          analysis.transparencyUsage 
                            ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700"
                            : "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
                        )}
                      >
                        {analysis.transparencyUsage ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                        {analysis.transparencyUsage ? "Used" : "None"}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{analysis.transparencyUsage ? "Transparency effects detected - may affect compatibility" : "No transparency effects used"}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analysis.transparencyUsage ? "May affect PDF compatibility" : "No compatibility issues"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
