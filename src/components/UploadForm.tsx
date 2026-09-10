import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, MapPin, Loader2 } from "lucide-react";
import { z } from "zod";

const reportSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be less than 500 characters"),
  image: z.instanceof(File).refine(file => file.size <= 5 * 1024 * 1024, "Image must be less than 5MB"),
});

interface UploadFormProps {
  onReportSubmitted: () => void;
}

const UploadForm = ({ onReportSubmitted }: UploadFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [dangerLevel, setDangerLevel] = useState<"moderate" | "severe">("moderate");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        toast({
          title: "Location captured",
          description: `Lat: ${position.coords.latitude.toFixed(6)}, Lng: ${position.coords.longitude.toFixed(6)}`,
        });
      },
      (error) => {
        toast({
          title: "Location Error",
          description: "Unable to get your location. Please enable location services.",
          variant: "destructive",
        });
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!image) {
      toast({
        title: "Error",
        description: "Please upload an image",
        variant: "destructive",
      });
      return;
    }

    if (!location) {
      toast({
        title: "Error",
        description: "Please capture your location first",
        variant: "destructive",
      });
      return;
    }

    try {
      reportSchema.parse({ description, image });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check for duplicate reports within 50m (if edge function is available)
      try {
        const response = await supabase.functions.invoke("check-duplicate", {
          body: { latitude: location.lat, longitude: location.lng },
        });

        if (response.data?.duplicate) {
          toast({
            title: "Duplicate Report",
            description: "A report already exists for this location.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Could not check for duplicates via edge function:", err);
      }

      // Upload image
      const fileExt = image.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("report-images")
        .upload(fileName, image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("report-images")
        .getPublicUrl(fileName);

      // Create report
      const { error: insertError } = await supabase.from("reports").insert({
        user_id: user.id,
        image_url: publicUrl,
        description,
        latitude: location.lat,
        longitude: location.lng,
        danger_level: dangerLevel,
        status: "pending",
      });

      if (insertError) throw insertError;

      toast({
        title: "Success!",
        description: "Your report has been submitted successfully",
      });

      // Reset form
      setImage(null);
      setDescription("");
      setDangerLevel("moderate");
      setLocation(null);
      onReportSubmitted();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to submit report";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Road Damage</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image">Upload Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the road damage..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="danger">Danger Level</Label>
            <Select value={dangerLevel} onValueChange={(val: "moderate" | "severe") => setDangerLevel(val)}>
              <SelectTrigger id="danger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="severe">Severe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Button
              type="button"
              variant="outline"
              onClick={getCurrentLocation}
              className="w-full gap-2"
            >
              <MapPin className="h-4 w-4" />
              {location ? "Location Captured" : "Capture Location"}
            </Button>
            {location && (
              <p className="text-sm text-muted-foreground">
                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Submit Report
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UploadForm;
